from PIL import Image
from segment_anything import sam_model_registry
from segment_anything.modeling import Sam
from segment_anything.utils.transforms import ResizeLongestSide
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

# Initialize FastAPI app
app = FastAPI()

# Define the request body
class PredictionRequest(BaseModel):
    device: str
    in_path: str
    out_path: str

# Define the response body
class PredictionResponse(BaseModel):
    message: str

checkpoint_path = "/var/www/vendor/biigle/magic-sam/microservice/sam_vit_h_4b8939.pth"
model_type = "vit_h"
sam = sam_model_registry[model_type](checkpoint=checkpoint_path)

@app.post("/embedding", response_model=PredictionResponse)
async def embedding(request: PredictionRequest):
    try:
        device = request.device
        in_path = request.in_path
        out_path = request.out_path
        print(f"device: {device}, in_path: {in_path}, out_path: {out_path}")

        sam.to(device=device)
        transform = ResizeLongestSide(sam.image_encoder.img_size)

        image = Image.open(in_path)

        if image.mode in ['RGBA', 'L', 'P', 'CMYK']:
            image = image.convert('RGB')
        elif image.mode in ['I', 'I;16']:
            image = Image.fromarray((np.array(image)/256).astype(np.uint8)).convert('RGB')

        if image.mode != 'RGB':
            return PredictionResponse(message=json.dumps({'error': 'Only RGB images supported'}))

        with torch.no_grad():
            input_image = transform.apply_image(np.array(image))
            input_image_torch = torch.as_tensor(input_image, device=device)
            transformed_image = input_image_torch.permute(2, 0, 1).contiguous()[None, :, :, :]
            input_image = sam.preprocess(transformed_image)
            image_embedding = sam.image_encoder(input_image).cpu().numpy()

        np.save(out_path, image_embedding)
        return PredictionResponse(message=json.dumps({'message': 'Image segmented successfully'}))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)