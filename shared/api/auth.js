// import axios from 'axios';

// export const authApi = {
//   register: (name, email, password) =>
//     axios.post('/api/auth/register', { name, email, password })
//       .then(r => r.data),

//   login: (email, password) =>
//     axios.post('/api/auth/login', { email, password })
//       .then(r => r.data),

//   me: () =>
//     axios.get('/api/auth/me')
//       .then(r => r.data),
// };

import { apiClient } from './index.js';

export const authApi = {
  register: (name, email, password) =>
    apiClient.post('/auth/register', { name, email, password })
      .then(r => r.data),

  login: (email, password) =>
    apiClient.post('/auth/login', { email, password })
      .then(r => r.data),

  me: () =>
    apiClient.get('/auth/me')
      .then(r => r.data),
};