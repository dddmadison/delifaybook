package com.delifaybook.server.domain.book;

import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;
import com.delifaybook.server.global.external.nlk.NlkClient;
import com.delifaybook.server.global.external.nlk.dto.NlkBookDoc;
import com.delifaybook.server.global.external.nlk.dto.NlkLookupResponse;
import com.delifaybook.server.global.util.IsbnNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.util.StringUtils.hasText;

@Service
@Transactional
public class BookService {

    private static final Logger log = LoggerFactory.getLogger(BookService.class);

    private final BookRepository bookRepository;
    private final NlkClient nlkClient;

    // "324 p." 또는 "324쪽" 등의 형식을 파싱하기 위한 정규식
    private static final Pattern PAGE_PATTERN = Pattern.compile("(\\d+)");

    public BookService(BookRepository bookRepository, NlkClient nlkClient) {
        this.bookRepository = bookRepository;
        this.nlkClient = nlkClient;
    }

    /**
     * ISBN으로 책을 조회하고, 없으면 NLK에서 가져와 저장(Upsert)합니다.
     * [수정됨] DB에 책이 있더라도 페이지 정보가 없으면(null or 0) NLK를 다시 조회하여 업데이트합니다.
     */
    public Book lookupAndUpsertByIsbn(String rawIsbn) {
        String isbn = IsbnNormalizer.normalizeOrThrow(rawIsbn);

        return bookRepository.findByIsbn(isbn)
                .map(book -> {
                    // ✅ Case 1: DB에 책이 존재함
                    // 페이지 정보가 비어있다면, NLK에서 정보를 다시 가져와 보강(Update) 시도
                    if (book.getItemPage() == null || book.getItemPage() == 0) {
                        try {
                            updateBookInfoFromNlk(book);
                        } catch (Exception e) {
                            // API 호출이 실패하더라도, 이미 있는 책 정보는 보여줘야 하므로 로그만 찍고 넘어감
                            log.warn("기존 책 페이지 정보 업데이트 실패 (ISBN: {}): {}", isbn, e.getMessage());
                        }
                    }
                    return book;
                })
                // ✅ Case 2: DB에 책이 없음 -> NLK 조회 후 신규 저장
                .orElseGet(() -> fetchFromNlkAndSave(isbn));
    }

    /**
     * DB에 없는 책을 NLK에서 가져와서 저장
     */
    private Book fetchFromNlkAndSave(String isbn) {
        NlkBookDoc doc = nlkClient.lookupByIsbn(isbn)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOK_NOT_FOUND));

        Book book = new Book(isbn);
        applyDocToBook(book, doc); // DTO -> Entity 매핑 공통 메서드 사용
        return bookRepository.save(book);
    }

    /**
     * 이미 존재하는 Book 엔티티에 NLK 최신 정보를 업데이트 (Dirty Checking)
     */
    private void updateBookInfoFromNlk(Book book) {
        nlkClient.lookupByIsbn(book.getIsbn())
                .ifPresent(doc -> {
                    applyDocToBook(book, doc);
                    log.info("책 정보 업데이트 완료 (ISBN: {}, Page: {})", book.getIsbn(), book.getItemPage());
                });
    }

    /**
     * NLK 응답(DTO)을 Book 엔티티에 매핑하는 공통 메서드
     */
    private void applyDocToBook(Book book, NlkBookDoc doc) {
        book.setTitle(doc.getTitle());
        book.setAuthor(doc.getAuthor());
        book.setPublisher(doc.getPublisher());
        book.setCoverUrl(doc.getCoverUrl());
        book.setPublishDate(doc.getPubDate());

        // 페이지 수 파싱 및 설정
        Integer page = parseItemPage(doc.getPage());
        if (page != null) {
            book.setItemPage(page);
        }
    }

    /**
     * NLK 검색 (Controller에서 사용)
     */
    public NlkLookupResponse search(String keyword, int page, int size) {
        return nlkClient.searchByKeyword(keyword, page, size);
    }

    /**
     * "324 p.", "xii, 324쪽" 등의 문자열에서 숫자만 추출
     */
    private Integer parseItemPage(String raw) {
        if (!hasText(raw)) return null;

        String s = raw.trim().replace(",", "");

        // "15권" 처럼 권수만 있는 데이터는 페이지로 취급하지 않음 (p 또는 쪽이 없으면 무시)
        if (s.contains("권") && !(s.toLowerCase().contains("p") || s.contains("쪽"))) {
            return null;
        }

        Matcher m = PAGE_PATTERN.matcher(s);
        if (m.find()) {
            try {
                int v = Integer.parseInt(m.group(1));
                // 유효범위 체크 (오류 데이터 방지, 0페이지거나 10000페이지 넘으면 무시)
                if (v > 0 && v < 10000) return v;
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}