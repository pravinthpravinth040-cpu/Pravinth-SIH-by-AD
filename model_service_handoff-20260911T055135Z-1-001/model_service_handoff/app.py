import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from inference import predict

# Look for .env in project root or current working directory
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
local_env = Path(__file__).resolve().parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env)
elif local_env.exists():
    load_dotenv(dotenv_path=local_env)
else:
    load_dotenv()

app = FastAPI(
    title="Sentinel-1 SAR Oil Spill Classifier API",
    description="Binary image classifier API for detecting oil spills in SAR images",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Oil Spill Detection API is running. Use POST /predict to upload an image."}

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if file.content_type and not file.content_type.startswith("image/"):
        allowed_exts = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')
        if file.filename and not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
            
    contents = await file.read()
    try:
        result = predict(contents)
        return JSONResponse(content={
            "filename": file.filename,
            "oil_detected": result["oil_detected"],
            "confidence": round(result["confidence"], 4),
            "raw_score": round(result["raw_score"], 4)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)

