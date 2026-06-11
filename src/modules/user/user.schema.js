import Joi from "joi";

const DATA_IMAGE_BASE64 = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const submitKycSchema = Joi.object({
  fullName: Joi.string().trim().min(2).required(),
  dob: Joi.string().trim().min(8).required(),
  address: Joi.string().trim().min(5).required(),
  phone: Joi.string().trim().min(8).required(),
  cccdFront: Joi.string().pattern(DATA_IMAGE_BASE64).required(),
  cccdBack: Joi.string().pattern(DATA_IMAGE_BASE64).required(),
});

export const updateProfileBodySchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  phone: Joi.string().trim().min(6).optional(),
  dob: Joi.string().trim().min(8).optional(),
  address: Joi.string().trim().min(5).optional(),
  services: Joi.array().items(Joi.string().trim().min(1)).optional(),
  bio: Joi.string().trim().max(1000).allow("").optional(),
  avatar: Joi.alternatives()
    .try(
      Joi.string().uri(),
      Joi.string().pattern(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/),
    )
    .optional()
    .allow(null),
  online: Joi.boolean().optional(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).optional(),
  savedAddresses: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        label: Joi.string().trim().min(1).required(),
        houseNumber: Joi.string().trim().allow("").optional(),
        street: Joi.string().trim().allow("").optional(),
        ward: Joi.string().trim().allow("").optional(),
        district: Joi.string().trim().allow("").optional(),
        city: Joi.string().trim().allow("").optional(),
        fullAddress: Joi.string().trim().allow("").optional(),
        line: Joi.string().trim().allow("").optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        state: Joi.string().trim().allow("").optional(),
        postalCode: Joi.string().trim().allow("").optional(),
        isDefault: Joi.boolean().optional(),
      }),
    )
    .optional(),
  accountStatus: Joi.string().valid("active", "blocked").optional(),
  verificationStatus: Joi.string().valid("pending", "verified", "rejected").optional(),
}).min(1);

export const listTaskersQuerySchema = Joi.object({
  scheduledStart: Joi.string().isoDate().optional(),
  scheduledEnd: Joi.string().isoDate().optional(),
}).and("scheduledStart", "scheduledEnd");
