from PIL import Image
from segment_anything import sam_model_registry
from segment_anything.modeling import Sam
from segment_anything.utils.transforms import ResizeLongestSide
import numpy as np
import sys
import torch

# checkpoint_path = "sam_vit_b_01ec64.pth"
checkpoint_path = sys.argv[1]
# model_type = "vit_b"
model_type = sys.argv[2]
# device = "cpu"
device = sys.argv[3]
in_path = sys.argv[4]
out_path = sys.argv[5]

sam = sam_model_registry[model_type](checkpoint=checkpoint_path)
sam.to(device=device)
transform = ResizeLongestSide(sam.image_encoder.img_size)

image = Image.open(in_path)

if image.mode == 'RGBA' or image.mode == 'L' or image.mode == 'P':
    image = image.convert('RGB')

if image.mode =='I':
    #I images need to be rescaled manually before converting
    image = Image.fromarray(((np.array(img)/(2**16))*2**8).astype(np.uint8)).convert('RGB')

if image.mode != 'RGB':
    raise ValueError(f'Only RGB images supported, was {image.mode}')

with torch.no_grad():
    input_image = transform.apply_image(np.array(image))
    input_image_torch = torch.as_tensor(input_image, device=device)
    transformed_image = input_image_torch.permute(2, 0, 1).contiguous()[None, :, :, :]
    input_image = sam.preprocess(transformed_image)
    image_embedding = sam.image_encoder(input_image).cpu().numpy()

np.save(out_path, image_embedding)
