import{c as o}from"./createLucideIcon-CpMz1Zt_-1777994832190.js";import{a as r}from"./index-B9ygI19o-1777994832190.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=o("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]),a=()=>"https://crmwhatsapp-1-ggpi.onrender.com",s=r.create({baseURL:a(),timeout:6e4,headers:{"Content-Type":"application/json"}});s.interceptors.request.use(e=>{const t=localStorage.getItem("alex_io_token")||sessionStorage.getItem("alex_io_token");return t&&(e.headers.Authorization=`Bearer ${t}`),e},e=>Promise.reject(e));export{i as C,s as a};
