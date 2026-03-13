package com.delifaybook.server.domain.book;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;

@Service
public class AiCoverService {

    private final String AI_SERVER_URL = "http://localhost:8000/api/extract-cover";
    private final BookRepository bookRepository;

    public AiCoverService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional
    public String generateAndSaveCover(String isbn, MultipartFile file) {
        try {
            // 1. 파이썬 AI 서버에 사진 던지고 뽀샵된 byte[] 받아오기
            byte[] processedImage = processWithAiServer(file);

            // 2. 받아온 이미지를 서버에 파일로 저장
            String savedUrl = saveImageLocally(isbn, processedImage);

            // 3. DB에 있는 Book 엔티티의 커버 URL 업데이트
            Book book = bookRepository.findByIsbn(isbn)
                    .orElseThrow(() -> new IllegalArgumentException("해당 ISBN의 책을 찾을 수 없습니다."));
            book.setCoverUrl(savedUrl);
            bookRepository.save(book);

            return savedUrl;

        } catch (IllegalArgumentException e) {
            // 🚨 [핵심 수정] 우리가 의도적으로 던진 예외(책 못 찾음, ISBN 없음 등)는 
            // 뭉개지 않고 그대로 밖으로 던집니다. (프론트에서 이 메시지를 띄우게 됨)
            throw e; 
        } catch (Exception e) {
            // 그 외의 진짜 시스템 에러(DB 접속 실패, 파일 쓰기 실패 등)
            e.printStackTrace(); 
            throw new RuntimeException("AI 커버 생성 중 시스템 오류 발생: " + e.getMessage());
        }
    }

    // --- 내부 헬퍼 메서드들 ---

    private byte[] processWithAiServer(MultipartFile file) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                // 압축돼서 넘어오면 파일명이 없을 수 있으니 방어 코드로 고정
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
            }
        };
        body.add("file", fileAsResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        
        try {
            // AI 서버 요청 실행!
            ResponseEntity<byte[]> response = restTemplate.postForEntity(AI_SERVER_URL, requestEntity, byte[].class);
            return response.getBody();
            
        } catch (HttpStatusCodeException e) {
            // 🔥 AI 서버가 400(책 못찾음)이나 500 에러를 뱉었을 때 RestTemplate이 던지는 예외
            String errorBody = e.getResponseBodyAsString();
            System.err.println("AI 서버 응답 에러: " + errorBody);
            
            // 프론트엔드가 Alert 창에 띄우기 딱 좋은 문구로 바꿔서 던집니다.
            throw new IllegalArgumentException("사진에서 책을 명확하게 인식하지 못했습니다. 배경과 대비되게 다시 찍어주세요!");
            
        } catch (RestClientException e) {
            // 🔥 파이썬 서버가 아예 꺼져있거나 통신이 불가능할 때
            System.err.println("AI 서버 연결 실패: " + e.getMessage());
            throw new IllegalArgumentException("AI 이미지 처리 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    private String saveImageLocally(String isbn, byte[] imageBytes) throws IOException {
        String uploadDir = System.getProperty("user.dir") + "/uploads/covers/";
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = isbn + "_" + UUID.randomUUID().toString().substring(0, 8) + ".jpg";
        File targetFile = new File(uploadDir + fileName);

        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(imageBytes);
        }

        return "/uploads/covers/" + fileName; // 주의: 프론트엔드 라우팅에 맞게 경로 확인 필요
    }
}