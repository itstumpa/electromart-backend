// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import config from './index';

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

export default cloudinary;