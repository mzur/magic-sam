from PIL import Image
from segment_anything import sam_model_registry
from segment_anything.utils.transforms import ResizeLongestSide
import numpy as np
import sys
import torch
import json

# checkpoint_path = "sam_vit_b_01ec64.pth"
checkpoint_path = sys.argv[1]
# model_type = "vit_b"
model_type = sys.argv[2]
# device = "cpu"
device = sys.argv[3]
# json file with list of input image paths
in_file = sys.argv[4]
# json file with list of the output paths to save the embeddings
out_file = sys.argv[5]

# get the requested model from the registry and load the checkpoint from given path
sam = sam_model_registry[model_type](checkpoint=checkpoint_path)
# transfer the model to device
sam.to(device=device)
# get the transform to apply to the input images
transform = ResizeLongestSide(sam.image_encoder.img_size)

# load the input and...
with open(in_file) as in_f:
    in_path=json.load(in_f)

# output paths from the respective json files
with open(out_file) as out_f:
    out_path=json.load(out_f)

assert len(in_path) == len(out_path), "Input and output paths must have the same length"

# iterate over the input and output paths and compute the embeddings
for in_path,out_path in zip(in_path,out_path):
    # load the image using PIL
    image = Image.open(in_path)

    # the image needs to be RGB. If it is RGBA, L or P, convert it to RGB using the given logic
    if image.mode == 'RGBA' or image.mode == 'L' or image.mode == 'P':
        image = image.convert('RGB')

    # I images (32 bit signed integer) need to be rescaled manually before converting.
    if image.mode =='I':
        image = Image.fromarray(((np.array(image)/(2**16))*2**8).astype(np.uint8)).convert('RGB')

    # for safety check the the image is RGB now. If not, raise an error
    if image.mode != 'RGB':
        raise ValueError(f'Only RGB images supported, was {image.mode}')

    # use no_grad to save memory
    with torch.no_grad():
        # apply the transform to the image
        input_image = transform.apply_image(np.array(image))
        # convert the image to tensor and move to device
        input_image_torch = torch.as_tensor(input_image, device=device)
        # convert the image to the required format and compute the embedding
        transformed_image = input_image_torch.permute(2, 0, 1).contiguous()[None, :, :, :]
        # preprocess the image
        input_image = sam.preprocess(transformed_image)
        # compute the embedding
        image_embedding = sam.image_encoder(input_image).cpu().numpy()
    # save the embedding to the given path in numpy binary format
    np.save(out_path, image_embedding)