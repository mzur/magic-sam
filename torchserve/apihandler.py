# handler.py
import io
import biigle
import numpy as np
from PIL import Image
from ts.torch_handler.base_handler import BaseHandler
from segment_anything import sam_model_registry, SamPredictor
import torch


class SegmentAnythingHandler(BaseHandler):
    def __init__(self):
        # call the BaseHandler constructor
        super(SegmentAnythingHandler, self).__init__()
        # model is not loaded yet
        self.initialized = False

    def initialize(self, ctx):
        #
        self.manifest = ctx.manifest
        # get properties of the context
        properties = ctx.system_properties
        # initialize the biigle Api with the email and token from the properties
        self.api=biigle.Api(email="",token="")
        # determine the device order gpu > mps > cpu
        self.device = torch.device(f"cuda:{properties['gpu_id']}" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        # load the vit_h model (it is bundled with the mar file)clear
        sam = sam_model_registry["vit_h"](checkpoint="sam_vit_h.pth")
        # move the model to the device
        sam.to(self.device)
        # create the predictor
        self.predictor = SamPredictor(sam)
        # indicate that the model is loaded
        self.initialized = True

    def handle(self, data, ctx):
        # get the image id from the json input, example {"img_id": 123}
        img_id = data[0].get("body").get("img_id")
        # get the x and y coordinates from the json input
        # these are the center coordinates of the image slice
        # example {"img_id": 123,"x": 456, "y": 789}
        x = data[0].get("body").get("x")
        y = data[0].get("body").get("y")
        # raise an exception if no image id is provided or in a wrong format
        if img_id is None:
            raise Exception("No image id provided. Input should be a json with key 'img_id' and value the Biigle image id.")
        # try to get the image from the Biigle API
        try:
            img=self.api.get(f"images/{img_id}/file").content
        except:
            # raise an exception if the image cannot be accessed (e.g. wrong image id, no access rights, etc.)
            raise Exception(f"Image with id {img_id} not found.")
        # read the image (bytesarray) into a PIL image using BytesIO as intermediate
        image = Image.open(io.BytesIO(img))
        # convert the image to a numpy array and change the color channel order from RGB to BGR
        image = np.array(image)[:,:,::-1]

        # initialize the additional result dict which will only be used if x and y are set
        additional_results = {}
        # if x and y are set, crop the image to the given coordinates
        if x is not None and y is not None:
            # get the image size
            w, h = image.shape[:2]
            # get the crop size
            crop_size = 1024
            # calculate the crop coordinates
            x1 = max(0, x - crop_size // 2)
            y1 = max(0, y - crop_size // 2)
            x2 = min(w, x + crop_size // 2)
            y2 = min(h, y + crop_size // 2)
            # crop the image
            image = image[y1:y2, x1:x2]
            # set the output result dict
            additional_results = {'input_center': [x,y],
            'crop_bbox': [x1,y1,x2,y2],
            'crop_bbox': [x1,y1,x2,y2]}
        # set the image in the predictor
        self.predictor.set_image(image)
        # get the embedding and metadata from the predictor
        result_dict = {'original_size': self.predictor.original_size,
                       'input_size': self.predictor.input_size,
                       'embedding': self.predictor.features.cpu().numpy().flatten().tolist()}
        # fuse additional_results into result_dict
        result_dict.update(additional_results)
        # return the results as base64 encoded pickle
        # return [base64.b64encode(pickle.dumps(result_dict)).decode('utf8')]
        return [result_dict]
