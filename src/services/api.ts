import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.clarifai.com',
  headers: {
    'Authorization': 'Key 694104f29f7f4e05886f4b0b85ed5ebc'
  }
});