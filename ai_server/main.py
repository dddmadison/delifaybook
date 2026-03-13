from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO

# FastAPI 앱 생성
app = FastAPI(title="DelifayBook AI Server")

# React 프론트엔드/Java 백엔드와 통신하기 위한 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. AI 모델 로드 (서버가 켜질 때 딱 한 번만 불러옵니다!)
try:
    model = YOLO("best.pt")
    print("AI 뇌(best.pt) 로딩 완료! 출격 준비 끝!")
except Exception as e:
    print("에러: best.pt 파일을 찾을 수 없습니다! 경로를 확인해주세요.")

# 정렬 헬퍼 함수: 4개의 점을 (좌상, 우상, 우하, 좌하) 순서로 정렬
def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # 좌상(Top-Left)
    rect[2] = pts[np.argmax(s)]   # 우하(Bottom-Right)
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)] # 우상(Top-Right)
    rect[3] = pts[np.argmax(diff)] # 좌하(Bottom-Left)
    return rect

# 2. 사진을 받아서 뽀샵 처리 후 돌려주는 핵심 API
@app.post("/api/extract-cover")
async def extract_book_cover(file: UploadFile = File(...)):
    try:
        # 사진 파일 읽기
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="이미지 파일을 읽을 수 없습니다.")

        # ==========================================
        # [1단계] YOLOv8 가위질 (책 영역 찾기)
        # ==========================================
        # 튜닝 1: conf 값을 0.25로 낮춰서 책 인식률을 대폭 상승시킵니다.
        results = model.predict(source=img_bgr, conf=0.25, verbose=False)
        
        if len(results) == 0 or results[0].masks is None or len(results[0].masks.xy) == 0:
            raise HTTPException(status_code=400, detail="사진에서 책을 찾지 못했습니다. 다시 찍어주세요!")

        # ==========================================
        # 📐 [2단계] OpenCV 다림질 (직사각형으로 쫙 펴기)
        # ==========================================
        # YOLO가 찾은 영역 중 가장 큰 영역(0번 인덱스)의 좌표들을 가져옵니다.
        points = results[0].masks.xy[0]
        contour = np.array(points, dtype=np.int32)
        
        # 튜닝 2: 수십 개의 다각형 점들을 4개의 꼭짓점(사각형)으로 예쁘게 깎아냅니다.
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        # 만약 사각형(4개의 점)으로 예쁘게 떨어지지 않으면, 테두리를 감싸는 최소 사각형을 강제로 만듭니다.
        if len(approx) == 4:
            pts = approx.reshape(4, 2).astype("float32")
        else:
            rect = cv2.minAreaRect(contour)
            box = cv2.boxPoints(rect)
            pts = np.array(box, dtype="float32")

        # 좌표 정렬 (좌상, 우상, 우하, 좌하)
        rect = order_points(pts)
        (tl, tr, br, bl) = rect
        
        # 새 이미지 해상도 계산
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))

        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))

        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]], dtype="float32")

        M = cv2.getPerspectiveTransform(rect, dst)
        warped_img = cv2.warpPerspective(img_bgr, M, (maxWidth, maxHeight))

        # ==========================================
        # [3단계] 안전한 뽀샵 처리 (컬러 보존 다크 모드)
        # ==========================================
        # LAB 변환 및 CLAHE (명암비 보정 - 텍스트 가독성 상승)
        lab = cv2.cvtColor(warped_img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        processed_lab = cv2.merge((cl, a, b))
        enhanced_img = cv2.cvtColor(processed_lab, cv2.COLOR_LAB2BGR)

        # 튜닝 3: 샤프닝(Unsharp Masking) 수치를 부드럽게 조절해서 노이즈를 줄입니다.
        gaussian_blur = cv2.GaussianBlur(enhanced_img, (0, 0), 2.0)
        final_img = cv2.addWeighted(enhanced_img, 1.2, gaussian_blur, -0.2, 0) # 수치 완화

        # ==========================================
        # 📤 4. 완성된 이미지를 전송!
        # ==========================================
        success, encoded_img = cv2.imencode('.jpg', final_img)
        if not success:
            raise HTTPException(status_code=500, detail="이미지 인코딩 실패")

        return Response(content=encoded_img.tobytes(), media_type="image/jpeg")

    except HTTPException as he:
        # 우리가 의도적으로 던진 400 에러는 그대로 다시 던집니다.
        raise he
    except Exception as e:
        # 예상치 못한 에러가 나면 500 에러로 감싸서 보냅니다.
        raise HTTPException(status_code=500, detail=f"서버 처리 중 에러 발생: {str(e)}")

# 서버 구동 확인용
@app.get("/")
def read_root():
    return {"message": "DelifayBook AI 서버가 정상 작동 중입니다! 🚀"}
