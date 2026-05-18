import{c as r}from"./createLucideIcon-w8RwwfZm.js";import{a as o}from"./index-B9ygI19o.js";import{g as a}from"./index-DH_JS3QZ.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=r("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]),s=()=>a()||"https://crmwhatsapp-1-ggpi.onrender.com",n=o.create({baseURL:s(),timeout:6e4,headers:{"Content-Type":"application/json"}});n.interceptors.request.use(e=>{const t=localStorage.getItem("alex_io_token")||sessionStorage.getItem("alex_io_token");return t&&(e.headers.Authorization=`Bearer ${t}`),e},e=>Promise.reject(e));export{m as C,n as a};
