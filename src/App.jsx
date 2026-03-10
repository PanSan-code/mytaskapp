import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { db, auth } from './firebase.js';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
// Cloudinary upload

// ─── Cloudinary upload helper ─────────────────────────────────────────────────
const CLOUDINARY_CLOUD = "dudnepxz5";
const CLOUDINARY_PRESET = "ml_default";
async function uploadFile(file) {
async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST", body: fd,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Cloudinary upload failed");
  return data.secure_url;
}
function newDocId(col) { return doc(collection(db, col)).id; }

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  zh: {
    appTitle:"任务平台",userSide:"用户",adminSide:"管理",lang:"EN",
    navTasks:"任务",navMy:"我的",navSubmit:"提交",
    tasksTitle:"进行中的任务",taskFilter:"截止日期",filterAll:"全部",
    taskDeadline:"截止",taskPhotos:"照片",taskAvail:"可领取",
    btnViewPhotos:"查看",btnBack:"返回",
    taskDetailDesc:"点击图片领取，领取后即可下载",
    btnClaim:"领取",btnClaimed:"已领取",btnDownload:"下载",
    claimTitle:"领取照片",emailLabel:"邮箱",emailPlaceholder:"example@gmail.com",
    emailHint:"支持：gmail · yahoo · outlook · hotmail · icloud · 163 · qq",
    emailInvalid:"请输入有效的主流邮箱地址",
    btnConfirmClaim:"确认领取",claimSuccess:"领取成功！",
    myTitle:"我的照片",myEmpty:"还没有领取任何照片",
    claimedAt:"领取时间",fromTask:"来自任务",
    submitTitle:"提交作品",submitTask:"选择任务",selectTask:"请选择任务",
    submitEmail:"邮箱",submitEmailHint:"输入领取时使用的邮箱，系统自动匹配任务",
    submitPhone:"手机收款号码",submitPhonePlaceholder:"请输入手机号码",
    submitPhoneConfirm:"确认手机收款号码",submitPhoneConfirmPlaceholder:"再次输入手机号码",
    submitPhoneMismatch:"两次输入的手机号码不一致",
    submitPhoneInvalid:"请输入有效的手机号码",
    submitOrderNo:"订单编号",submitOrderPlaceholder:"请输入订单编号",
    submitFile:"上传作品",submitNote:"备注",
    submitNotePlaceholder:"可选，描述您的作品...",btnSubmit:"提交作品",
    submitSuccess:"提交成功！",submitNoTask:"请选择任务",
    submitNoFile:"请选择文件",submitCount:"已提交",submitMax:"已达上限（3次）",
    submitNoClaimForEmail:"该邮箱尚未领取任何任务照片",
    submitNoClaimForTask:"该邮箱未领取此任务的照片",
    submitClaimedTask:"已领取任务",submitNoClaimedTasks:"暂无已领取任务",
    submitPhotoInfo:"已领取照片",
    adOverview:"总览",adTasks:"任务",adClaims:"领取",adSubmissions:"提交",
    ovPhotoTotal:"照片总数",ovClaimed:"已领取",ovSubmissions:"提交数",ovTasks:"任务数",
    btnAddTask:"新建任务",colTaskName:"任务名称",colDeadline:"截止日期",
    colPhotos:"照片数",colActions:"操作",btnEdit:"编辑",btnDelete:"删除",
    confirmDelete:"确认删除此任务？操作不可撤销。",
    taskNameLabel:"任务名称",taskDeadlineLabel:"截止日期",
    taskDescLabel:"描述",btnSave:"保存",btnCancel:"取消",
    uploadPhotos:"上传照片",uploadHint:"点击选择图片（JPG / PNG / WEBP）",
    uploadedCount:"张",
    colSubmitEmail:"邮箱",colSubmitTask:"任务",colSubmitTime:"提交时间",
    colSubmitNote:"备注",colSubmitPhone:"收款号",colSubmitOrder:"订单编号",
    noData:"暂无数据",noPhotos:"该任务暂无照片",
    searchPlaceholder:"搜索任务…",searchNoResult:"未找到匹配任务",
    adClaimsTitle:"领取管理",noClaims:"暂无领取记录",
    noClaimedPhotos:"暂无已领取照片",
    colClaimedPhoto:"照片",colClaimedBy:"领取邮箱",colClaimedAt:"领取时间",
    btnReset:"重置",confirmReset:"确认重置此照片的领取记录？",
    resetSuccess:"已重置！",
    colSubmitWork:"提交作品",btnViewWork:"查看",
    workModalTitle:"提交作品预览",noWorkImage:"未上传图片",
    btnExport:"导出 Excel",exportTitle:"选择导出内容",
    exportTasks:"选择任务",exportCols:"选择列",
    exportColEmail:"邮箱",exportColPhone:"手机号",exportColOrder:"订单编号",
    exportColImages:"提交图片数",exportColNote:"备注",exportColTime:"提交时间",
    exportSelectAll:"全选",exportClear:"清除",
    exportConfirm:"导出",exportNoTask:"请至少选择一个任务",exportNoCol:"请至少选择一列",
    exportEmpty:"所选任务无提交记录",
  },
  en: {
    appTitle:"Task Platform",userSide:"User",adminSide:"Admin",lang:"中文",
    navTasks:"Tasks",navMy:"My Photos",navSubmit:"Submit",
    tasksTitle:"Active Tasks",taskFilter:"Deadline",filterAll:"All",
    taskDeadline:"Deadline",taskPhotos:"Photos",taskAvail:"Available",
    btnViewPhotos:"View",btnBack:"Back",
    taskDetailDesc:"Tap a photo to claim and download",
    btnClaim:"Claim",btnClaimed:"Claimed",btnDownload:"Download",
    claimTitle:"Claim Photo",emailLabel:"Email",emailPlaceholder:"example@gmail.com",
    emailHint:"Supported: gmail · yahoo · outlook · hotmail · icloud",
    emailInvalid:"Please enter a valid email address",
    btnConfirmClaim:"Confirm",claimSuccess:"Claimed!",
    myTitle:"My Photos",myEmpty:"No photos claimed yet",
    claimedAt:"Claimed At",fromTask:"From",
    submitTitle:"Submit Work",submitTask:"Select Task",selectTask:"Select a task",
    submitEmail:"Email",submitEmailHint:"Enter the email you used to claim, tasks will auto-match",
    submitPhone:"Payment Phone",submitPhonePlaceholder:"Enter phone number",
    submitPhoneConfirm:"Confirm Phone",submitPhoneConfirmPlaceholder:"Re-enter phone number",
    submitPhoneMismatch:"Phone numbers do not match",
    submitPhoneInvalid:"Please enter a valid phone number",
    submitOrderNo:"Order No.",submitOrderPlaceholder:"Enter order number",
    submitFile:"Upload Work",submitNote:"Note",
    submitNotePlaceholder:"Optional — describe your work...",btnSubmit:"Submit",
    submitSuccess:"Submitted!",submitNoTask:"Please select a task",
    submitNoFile:"Please upload a file",submitCount:"Submitted",submitMax:"Limit reached (3)",
    submitNoClaimForEmail:"This email hasn't claimed any photos",
    submitNoClaimForTask:"This email hasn't claimed this task's photo",
    submitClaimedTask:"Claimed Tasks",submitNoClaimedTasks:"No claimed tasks",
    submitPhotoInfo:"Claimed Photo",
    adOverview:"Overview",adTasks:"Tasks",adClaims:"Claims",adSubmissions:"Submissions",
    ovPhotoTotal:"Total Photos",ovClaimed:"Claimed",ovSubmissions:"Submissions",ovTasks:"Tasks",
    btnAddTask:"New Task",colTaskName:"Task Name",colDeadline:"Deadline",
    colPhotos:"Photos",colActions:"Actions",btnEdit:"Edit",btnDelete:"Delete",
    confirmDelete:"Delete this task? This cannot be undone.",
    taskNameLabel:"Task Name",taskDeadlineLabel:"Deadline",
    taskDescLabel:"Description",btnSave:"Save",btnCancel:"Cancel",
    uploadPhotos:"Upload Photos",uploadHint:"Tap to select images (JPG / PNG / WEBP)",
    uploadedCount:"uploaded",
    colSubmitEmail:"Email",colSubmitTask:"Task",colSubmitTime:"Time",
    colSubmitNote:"Note",colSubmitPhone:"Phone",colSubmitOrder:"Order No.",
    noData:"No data",noPhotos:"No photos yet",
    searchPlaceholder:"Search tasks…",searchNoResult:"No matching tasks",
    adClaimsTitle:"Claims",noClaims:"No claims yet",
    noClaimedPhotos:"No claimed photos yet",
    colClaimedPhoto:"Photo",colClaimedBy:"Claimed By",colClaimedAt:"Claimed At",
    btnReset:"Reset",confirmReset:"Reset this claim? The photo will become available again.",
    resetSuccess:"Reset!",
    colSubmitWork:"Work",btnViewWork:"View",
    workModalTitle:"Submitted Work",noWorkImage:"No image",
    btnExport:"Export Excel",exportTitle:"Choose Export Content",
    exportTasks:"Select Tasks",exportCols:"Select Columns",
    exportColEmail:"Email",exportColPhone:"Phone",exportColOrder:"Order No.",
    exportColImages:"Images Submitted",exportColNote:"Note",exportColTime:"Submit Time",
    exportSelectAll:"All",exportClear:"Clear",
    exportConfirm:"Export",exportNoTask:"Select at least one task",exportNoCol:"Select at least one column",
    exportEmpty:"No submissions in selected tasks",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALLOWED_DOMAINS=["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","163.com","126.com","qq.com"];
function validateEmail(e){const p=e.trim().toLowerCase().split("@");return p.length===2&&ALLOWED_DOMAINS.includes(p[1]);}
function validatePhone(p){return /^1[3-9]\d{9}$/.test(p.trim())||/^\+?\d{7,15}$/.test(p.trim());}
function fmtDate(d){return new Date(d).toLocaleDateString();}
function fmtTime(d){return new Date(d).toLocaleString();}
let _id=200;function uid(){return String(++_id);}
function fuzzyMatch(str,query){
  if(!query)return true;
  const s=str.toLowerCase(),q=query.toLowerCase().trim();
  if(s.includes(q))return true;
  let si=0;for(let i=0;i<q.length;i++){const idx=s.indexOf(q[i],si);if(idx===-1)return false;si=idx+1;}
  return true;
}
const GRADIENTS=["linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#f093fb,#f5576c)","linear-gradient(135deg,#4facfe,#00f2fe)","linear-gradient(135deg,#43e97b,#38f9d7)","linear-gradient(135deg,#fa709a,#fee140)","linear-gradient(135deg,#a18cd1,#fbc2eb)","linear-gradient(135deg,#fccb90,#d57eeb)","linear-gradient(135deg,#a1c4fd,#c2e9fb)","linear-gradient(135deg,#fd7043,#ff8a65)","linear-gradient(135deg,#26c6da,#00acc1)"];
function makeSeedPhoto(idx,tid){return{id:`T${tid}-P${idx+1}`,name:`photo-${String(idx+1).padStart(2,"0")}.jpg`,gradient:GRADIENTS[idx%GRADIENTS.length],url:null,claimedBy:null,claimedAt:null};}
function makeSeedTasks(){return[
  {id:"t1",name:"城市街景",nameEn:"City Streets",deadline:"2026-04-01",desc:"拍摄城市街道日常场景",photos:Array.from({length:6},(_,i)=>makeSeedPhoto(i,"t1"))},
  {id:"t2",name:"自然风光",nameEn:"Nature Scenery",deadline:"2026-03-25",desc:"山川河流等自然景观",photos:Array.from({length:4},(_,i)=>makeSeedPhoto(i,"t2"))},
  {id:"t3",name:"人文纪实",nameEn:"Documentary",deadline:"2026-05-10",desc:"记录真实人文故事",photos:[]},
];}
const SEED_SUBS=[{id:"s1",email:"user@gmail.com",taskId:"t1",note:"城市夜景系列",phone:"13800138000",orderNo:"ORD-20260304-001",submittedAt:Date.now()-3600000}];

// ─── Xiaomi-style CSS ─────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
@font-face{font-family:'MiSans';src:local('MiSans'),local('MiSans-Regular');font-weight:400;}
@font-face{font-family:'MiSans';src:local('MiSans Medium'),local('MiSans-Medium');font-weight:500;}
@font-face{font-family:'MiSans';src:local('MiSans Semibold'),local('MiSans-Semibold');font-weight:600;}
@font-face{font-family:'MiSans';src:local('MiSans Bold'),local('MiSans-Bold');font-weight:700;}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{
  --mi-orange:#FF6900;
  --mi-orange-light:#FFF3EC;
  --mi-orange-dark:#E55A00;
  --bg:#F5F5F5;
  --surface:#FFFFFF;
  --surface2:#FAFAFA;
  --border:#EBEBEB;
  --text:#333333;
  --text2:#666666;
  --text3:#999999;
  --success:#00C853;
  --danger:#F44336;
  --info:#2196F3;
  --radius:12px;
  --radius-sm:8px;
  --radius-xs:6px;
  --hdr:56px;
  --bnav:64px;
  --shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --shadow:0 2px 8px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.05);
  --shadow-lg:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);
}
html,body{height:100%;font-family:'MiSans','Noto Sans SC','HarmonyOS Sans SC','PingFang SC','SF Pro Text','Microsoft YaHei UI',system-ui,sans-serif;background:var(--bg);color:var(--text);overscroll-behavior:none;-webkit-font-smoothing:antialiased;}
button{cursor:pointer;font-family:'MiSans','Noto Sans SC','HarmonyOS Sans SC','PingFang SC',system-ui,sans-serif;-webkit-appearance:none;touch-action:manipulation;outline:none;}
input,select,textarea{font-family:'MiSans','Noto Sans SC','HarmonyOS Sans SC','PingFang SC',system-ui,sans-serif;-webkit-appearance:none;appearance:none;outline:none;}
select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px!important;}

/* Animations */
.fade-in{animation:fadeIn .2s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.slide-up{animation:slideUpAnim .3s cubic-bezier(.25,.8,.25,1);}
@keyframes slideUpAnim{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
.scale-in{animation:scaleIn .2s ease;}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}

/* Surface / Card */
.surface{background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow-sm);}
.surface-sm{background:var(--surface);border-radius:var(--radius-sm);box-shadow:var(--shadow-sm);}

/* Buttons - Xiaomi style */
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 20px;border-radius:var(--radius-sm);font-size:14px;font-weight:500;border:none;transition:all .15s;touch-action:manipulation;gap:6px;letter-spacing:.01em;}
.btn:active{transform:scale(.97);}
.btn-primary{background:var(--mi-orange);color:#fff;}
.btn-primary:hover{background:var(--mi-orange-dark);}
.btn-primary:disabled{background:#FFB380;cursor:not-allowed;transform:none;}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--text2);border-radius:var(--radius-sm);}
.btn-ghost:hover{border-color:#999;color:var(--text);}
.btn-danger{background:transparent;border:1.5px solid #FFCDD2;color:var(--danger);min-height:36px;padding:0 14px;font-size:13px;border-radius:var(--radius-xs);}
.btn-sm{min-height:36px;padding:0 14px;font-size:13px;}
.btn-xs{min-height:32px;padding:0 12px;font-size:12px;border-radius:6px;}
.btn-icon{width:40px;height:40px;min-height:40px;padding:0;border-radius:50%;border:none;}

/* Tags */
.tag{display:inline-flex;align-items:center;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.02em;}
.tag-orange{background:var(--mi-orange-light);color:var(--mi-orange);}
.tag-green{background:#E8F5E9;color:#2E7D32;}
.tag-red{background:#FFEBEE;color:#C62828;}
.tag-gray{background:#F5F5F5;color:#757575;}
.tag-blue{background:#E3F2FD;color:#1565C0;}

/* Input */
.inp{width:100%;border:1.5px solid var(--border);background:var(--surface);padding:12px 14px;font-size:14px;border-radius:var(--radius-sm);color:var(--text);transition:border-color .15s;}
.inp:focus{border-color:var(--mi-orange);}
.inp::placeholder{color:var(--text3);}
.inp:disabled{background:#FAFAFA;color:var(--text3);}
.inp-sm{padding:10px 12px;font-size:13px;}

/* Form group */
.form-group{margin-bottom:16px;}
.form-label{font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;letter-spacing:.02em;text-transform:uppercase;}
.form-hint{font-size:11px;color:var(--text3);margin-top:5px;line-height:1.4;}
.form-error{font-size:12px;color:var(--danger);margin-top:5px;display:flex;align-items:center;gap:4px;}

/* Toast */
.toast{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);z-index:999;padding:10px 22px;border-radius:24px;font-size:13px;font-weight:500;box-shadow:var(--shadow-lg);animation:toastIn .3s ease;white-space:nowrap;max-width:90vw;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.toast-success{background:#1B5E20;color:#fff;}
.toast-error{background:#B71C1C;color:#fff;}

/* Overlay / Sheet / Dialog */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(2px);}
.overlay-center{align-items:center;}
.sheet{background:var(--surface);border-radius:20px 20px 0 0;width:100%;max-width:600px;max-height:94vh;overflow-y:auto;padding:8px 20px 40px;}
.sheet-handle{width:36px;height:4px;background:#E0E0E0;border-radius:2px;margin:12px auto 16px;}
.dialog{background:var(--surface);border-radius:16px;width:88%;max-width:400px;padding:24px 20px;box-shadow:var(--shadow-lg);}

/* Header */
.app-header{position:fixed;top:0;left:0;right:0;z-index:100;height:var(--hdr);background:var(--surface);display:flex;align-items:center;padding:0 16px;gap:12px;border-bottom:1px solid var(--border);box-shadow:var(--shadow-sm);}

/* Bottom Nav */
.bnav{position:fixed;bottom:0;left:0;right:0;z-index:100;height:var(--bnav);background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:stretch;padding-bottom:env(safe-area-inset-bottom,0);}
.bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:none;background:transparent;color:var(--text3);font-size:10px;font-weight:500;padding:0;transition:color .15s;letter-spacing:.02em;}
.bnav-item .ni{font-size:22px;line-height:1;transition:transform .15s;}
.bnav-item.active{color:var(--mi-orange);}
.bnav-item.active .ni{transform:scale(1.1);}

/* Admin Tabs */
.admin-tabs{display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;gap:4px;margin-bottom:16px;padding-bottom:1px;}
.admin-tabs::-webkit-scrollbar{display:none;}
.admin-tab{flex-shrink:0;background:var(--surface);border:none;padding:8px 16px;font-size:13px;font-weight:500;color:var(--text2);border-radius:20px;white-space:nowrap;transition:all .2s;}
.admin-tab.active{background:var(--mi-orange);color:#fff;}

/* Pages */
.page{padding-top:calc(var(--hdr)+12px);padding-bottom:calc(var(--bnav)+12px);min-height:100vh;}
.page-inner{max-width:640px;margin:0 auto;padding:0 16px;}
.admin-page{padding-top:calc(var(--hdr)+12px);padding-bottom:24px;min-height:100vh;}
.admin-inner{max-width:900px;margin:0 auto;padding:0 16px;}

/* Section title */
.section-title{font-size:18px;font-weight:700;color:var(--text);margin-bottom:14px;}
.section-sub{font-size:12px;color:var(--text3);margin-top:2px;}

/* Photo grid */
.photo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
@media(min-width:480px){.photo-grid{grid-template-columns:repeat(3,1fr);}}
@media(min-width:700px){.photo-grid{grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px;}}
.photo-wrap{position:relative;border-radius:var(--radius);overflow:hidden;background:var(--surface);box-shadow:var(--shadow-sm);}
.photo-img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;}
.photo-grad{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:28px;}
.photo-footer{padding:8px 10px 10px;}
.photo-name{font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;font-weight:500;}
.claimed-overlay{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px;}
.claimed-badge{background:rgba(255,255,255,.95);color:var(--text);padding:3px 14px;border-radius:20px;font-size:11px;font-weight:600;}

/* Task card */
.task-card{background:var(--surface);border-radius:var(--radius);padding:14px;display:flex;gap:12px;align-items:center;box-shadow:var(--shadow-sm);margin-bottom:10px;}
.task-thumb{width:44px;height:44px;border-radius:var(--radius-xs);overflow:hidden;flex-shrink:0;}

/* Claim group */
.claim-group{background:var(--surface);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow-sm);margin-bottom:10px;}
.claim-group-hdr{padding:14px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;background:var(--surface);}
.claim-group-hdr:active{background:#FAFAFA;}
.claim-row{padding:12px 16px;display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);background:var(--surface2);}

/* Sub card */
.sub-card{background:var(--surface);border-radius:var(--radius);padding:14px 16px;margin-bottom:10px;box-shadow:var(--shadow-sm);}

/* Stat */
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;}
@media(min-width:600px){.stat-grid{grid-template-columns:repeat(4,1fr);}}
.stat-card{background:var(--surface);border-radius:var(--radius);padding:16px;}
.stat-num{font-size:32px;font-weight:700;line-height:1;}
.stat-label{font-size:11px;font-weight:600;color:var(--text3);margin-top:4px;text-transform:uppercase;letter-spacing:.04em;}

/* Upload */
.upload-zone{border:2px dashed var(--border);border-radius:var(--radius);padding:20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--surface2);}
.upload-zone.drag,.upload-zone:active{border-color:var(--mi-orange);background:var(--mi-orange-light);}
.up-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px;margin-top:12px;}
.up-item{position:relative;border-radius:var(--radius-xs);overflow:hidden;}
.up-img{width:100%;height:70px;object-fit:cover;display:block;}
.up-grad{width:100%;height:70px;}
.up-rm{position:absolute;top:3px;right:3px;background:rgba(244,67,54,.9);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-weight:700;}

/* Search */
.search-wrap{position:relative;width:100%;}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--text3);pointer-events:none;}
.search-inp{padding-left:36px!important;}
.search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:var(--border);border:none;color:var(--text2);font-size:11px;cursor:pointer;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;}

/* Submit 2-col */
.submit-grid{display:grid;grid-template-columns:1fr;gap:16px;}
@media(min-width:640px){.submit-grid{grid-template-columns:1fr 1fr;}}

/* Divider */
.divider{height:1px;background:var(--border);margin:16px 0;}

/* Info row in sub card */
.info-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px;}
.info-chip{display:inline-flex;align-items:center;gap:5px;background:var(--bg);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:500;color:var(--text2);}

/* Lightbox */
.lightbox{background:#1A1A1A;border-radius:20px 20px 0 0;width:100%;max-width:720px;}
@media(min-width:720px){.lightbox{border-radius:16px;width:92%;}}

/* Mi-style section card */
.section-card{background:var(--surface);border-radius:var(--radius);padding:16px;margin-bottom:12px;box-shadow:var(--shadow-sm);}
.section-card-title{font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px;text-transform:uppercase;letter-spacing:.04em;}

/* Step indicator */
.step-dot{width:20px;height:20px;border-radius:50%;background:var(--mi-orange);color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
.step-dot.done{background:#E8F5E9;color:#2E7D32;}
.step-dot.dim{background:#F5F5F5;color:#BDBDBD;}
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [locale,setLocale]=useState("zh");
  const [view,setView]=useState("user");
  const [tasks,setTasks]=useState([]);
  const [submissions,setSubmissions]=useState([]);
  const [appLoading,setAppLoading]=useState(true);
  const [toast,setToast]=useState(null);
  const [adminUser,setAdminUser]=useState(null); // Firebase auth user
  const [userEmail,setUserEmail]=useState(""); // logged-in user email
  const showToast=useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);},[]);

  useEffect(()=>{
    // Listen to Firebase auth state
    const unsub=onAuthStateChanged(auth,u=>setAdminUser(u));
    return unsub;
  },[]);

  useEffect(()=>{
    let first=true;
    const u1=onSnapshot(collection(db,'tasks'),snap=>{
      setTasks(snap.docs.map(d=>({id:d.id,...d.data(),photos:d.data().photos||[]})));
      if(first){setAppLoading(false);first=false;}
    },err=>{console.error(err);setAppLoading(false);});
    const u2=onSnapshot(collection(db,'submissions'),snap=>{
      setSubmissions(snap.docs.map(d=>({id:d.id,...d.data()})));
    },err=>console.error(err));
    return()=>{u1();u2();};
  },[]);

  const t=T[locale];
  const allClaims=tasks.flatMap(tk=>(tk.photos||[]).filter(p=>p.claimedBy).map(p=>({...p,taskId:tk.id,taskName:tk.name,taskNameEn:tk.nameEn})));
  // Filter claims/submissions for current user
  const userClaims=userEmail?allClaims.filter(p=>p.claimedBy===userEmail):[];
  const userSubmissions=userEmail?submissions.filter(s=>s.email===userEmail):[];

  if(appLoading) return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{fontSize:14,color:"var(--text3)"}}>加载中…</div>
      </div>
    </div>
  );

  // If admin view and not logged in, show admin login
  if(view==="admin"&&!adminUser) return(
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <style>{CSS}</style>
      <AdminLogin t={t} locale={locale} setLocale={setLocale} onBack={()=>setView("user")}/>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <style>{CSS}</style>

      {/* Header */}
      <header className="app-header">
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:"var(--mi-orange)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:14,color:"#fff",fontWeight:800}}>M</span>
          </div>
          <span style={{fontSize:15,fontWeight:700,color:"var(--text)",letterSpacing:"-.01em"}}>{t.appTitle}</span>
        </div>
        <div style={{display:"flex",background:"var(--bg)",borderRadius:8,overflow:"hidden",border:"1px solid var(--border)"}}>
          {[["user",t.userSide,"#FF6900"],["admin",t.adminSide,"#333"]].map(([v,lbl,c])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{padding:"6px 14px",background:view===v?c:"transparent",color:view===v?"#fff":"var(--text2)",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
              {lbl}
            </button>
          ))}
        </div>
        {view==="admin"&&adminUser
          ?<button onClick={()=>signOut(auth).then(()=>setView("user"))}
            style={{background:"#FFEBEE",border:"1px solid #FFCDD2",color:"var(--danger)",padding:"5px 10px",borderRadius:6,fontSize:11,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
            退出
          </button>
          :<button onClick={()=>setLocale(l=>l==="zh"?"en":"zh")}
            style={{background:"var(--bg)",border:"1px solid var(--border)",color:"var(--text2)",padding:"5px 10px",borderRadius:6,fontSize:11,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
            {t.lang}
          </button>
        }
      </header>

      {view==="user"
        ?<UserView tasks={tasks} allClaims={allClaims} userClaims={userClaims} submissions={submissions} userSubmissions={userSubmissions} userEmail={userEmail} setUserEmail={setUserEmail} t={t} locale={locale} showToast={showToast}/>
        :<AdminView tasks={tasks} allClaims={allClaims} submissions={submissions} t={t} locale={locale} showToast={showToast}/>}

      {toast&&<div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

// ─── AdminLogin ───────────────────────────────────────────────────────────────
function AdminLogin({t,locale,setLocale,onBack}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const handleLogin=async()=>{
    if(!email||!password){setError("请填写邮箱和密码");return;}
    setLoading(true);setError("");
    try{
      await signInWithEmailAndPassword(auth,email,password);
    }catch(err){
      setError("邮箱或密码错误");
      setLoading(false);
    }
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,background:"var(--mi-orange)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:26}}>🔑</div>
          <div style={{fontSize:20,fontWeight:800}}>管理员登录</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>Admin Login</div>
        </div>
        <div className="surface" style={{padding:24}}>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input className="inp" type="email" placeholder="admin@example.com" value={email}
              onChange={e=>{setEmail(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="inp" type="password" placeholder="••••••••" value={password}
              onChange={e=>{setPassword(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          {error&&<div style={{background:"#FFEBEE",color:"var(--danger)",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:14}}>⚠️ {error}</div>}
          <button className="btn btn-primary" style={{width:"100%",fontWeight:700,fontSize:15}} onClick={handleLogin} disabled={loading}>
            {loading?"登录中…":"登录"}
          </button>
        </div>
        <button onClick={onBack} style={{display:"block",margin:"16px auto 0",background:"none",border:"none",color:"var(--text3)",fontSize:13,cursor:"pointer"}}>
          ← 返回用户端
        </button>
      </div>
    </div>
  );
}

// ─── UserView ─────────────────────────────────────────────────────────────────
function UserView({tasks,allClaims,userClaims,submissions,userSubmissions,userEmail,setUserEmail,t,locale,showToast}){
  const [tab,setTab]=useState("tasks");
  const [detailId,setDetailId]=useState(null);
  const switchTab=useCallback((k)=>{setTab(k);setDetailId(null);},[]);
  const detailTask=detailId?tasks.find(tk=>tk.id===detailId):null;
  const NAV=[{k:"tasks",icon:"📋",label:t.navTasks},{k:"my",icon:"🖼️",label:t.navMy},{k:"submit",icon:"📤",label:t.navSubmit}];
  return(
    <>
      <div className="page">
        <div className="page-inner">
          {/* User email banner */}
          {!userEmail?(
            <UserEmailBanner setUserEmail={setUserEmail} t={t}/>
          ):(
            <div style={{background:"var(--mi-orange-light)",border:"1px solid #FFB380",borderRadius:10,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              <span style={{fontSize:12,color:"var(--mi-orange)",fontWeight:600}}>✉️ {userEmail}</span>
              <button onClick={()=>setUserEmail("")} style={{background:"none",border:"none",color:"var(--text3)",fontSize:11,cursor:"pointer",padding:"2px 6px"}}>切换</button>
            </div>
          )}
          {tab==="tasks"&&detailId&&detailTask?(
            <div className="fade-in">
              <TaskDetailTab task={detailTask} tasks={tasks} t={t} locale={locale} showToast={showToast} onBack={()=>setDetailId(null)}/>
            </div>
          ):(
            <div className="fade-in" key={tab}>
              {tab==="tasks"&&<TaskListTab tasks={tasks} locale={locale} t={t} onView={setDetailId}/>}
              {tab==="my"&&<MyPhotosTab allClaims={userEmail?userClaims:allClaims} t={t} locale={locale} userEmail={userEmail}/>}
              {tab==="submit"&&<SubmitTab tasks={tasks} submissions={userEmail?userSubmissions:submissions} userEmail={userEmail} t={t} locale={locale} showToast={showToast}/>}
            </div>
          )}
        </div>
      </div>
      <nav className="bnav">
        {NAV.map(({k,icon,label})=>(
          <button key={k} className={`bnav-item${tab===k?" active":""}`} onClick={()=>switchTab(k)}>
            <span className="ni">{icon}</span><span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

// ─── UserEmailBanner ──────────────────────────────────────────────────────────
function UserEmailBanner({setUserEmail,t}){
  const [email,setEmail]=useState("");
  const [error,setError]=useState("");
  const handleConfirm=()=>{
    if(!validateEmail(email)){setError(t.emailInvalid);return;}
    setUserEmail(email.trim().toLowerCase());
  };
  return(
    <div style={{background:"var(--surface)",borderRadius:12,padding:16,marginBottom:16,boxShadow:"var(--shadow-sm)"}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>👋 欢迎使用任务平台</div>
      <div style={{fontSize:12,color:"var(--text3)",marginBottom:12}}>请输入您的邮箱以查看个人数据</div>
      <div style={{display:"flex",gap:8}}>
        <input className="inp" style={{flex:1}} type="email" placeholder={t.emailPlaceholder}
          value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
          onKeyDown={e=>e.key==="Enter"&&handleConfirm()}/>
        <button className="btn btn-primary btn-sm" style={{flexShrink:0}} onClick={handleConfirm}>确认</button>
      </div>
      {error&&<p className="form-error" style={{marginTop:6}}>⚠️ {error}</p>}
      <p className="form-hint" style={{marginTop:6}}>{t.emailHint}</p>
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
function SearchBar({value,onChange,placeholder}){
  return(
    <div className="search-wrap">
      <span className="search-icon">🔍</span>
      <input className="inp search-inp" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>
      {value&&<button className="search-clear" onClick={()=>onChange("")}>✕</button>}
    </div>
  );
}

// ─── TaskListTab ──────────────────────────────────────────────────────────────
function TaskListTab({tasks,locale,t,onView}){
  const [filterDate,setFilterDate]=useState("");
  const [search,setSearch]=useState("");
  const filtered=tasks.filter(tk=>{
    const mDate=!filterDate||tk.deadline>=filterDate;
    const mSearch=fuzzyMatch(tk.name+" "+tk.nameEn+" "+tk.desc,search);
    return mDate&&mSearch;
  });
  return(
    <div>
      <div className="section-title">{t.tasksTitle}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        <SearchBar value={search} onChange={setSearch} placeholder={t.searchPlaceholder}/>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:600,color:"var(--text3)",flexShrink:0,textTransform:"uppercase",letterSpacing:".04em"}}>{t.taskFilter}</span>
          <input type="date" className="inp inp-sm" style={{flex:1}} value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
          {filterDate&&<button className="btn btn-ghost btn-xs" onClick={()=>setFilterDate("")}>{t.filterAll}</button>}
        </div>
      </div>
      {filtered.length===0?<Empty label={t.searchNoResult}/>:(
        filtered.map(task=>{
          const total=task.photos.length,avail=task.photos.filter(p=>!p.claimedBy).length;
          return(
            <div key={task.id} className="task-card">
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {task.photos.slice(0,2).map(p=>(
                  <div key={p.id} className="task-thumb">
                    {p.url?<img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:p.gradient}}/>}
                  </div>
                ))}
                {total>2&&<div className="task-thumb" style={{background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--text3)"}}>+{total-2}</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:14}}>{locale==="zh"?task.name:task.nameEn}</span>
                  {total===0?<span className="tag tag-gray">0</span>
                    :<span className={`tag ${avail>0?"tag-green":"tag-red"}`}>{avail}/{total}</span>}
                </div>
                <p style={{color:"var(--text3)",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{task.desc}</p>
                <span style={{fontSize:11,color:"var(--text3)",fontWeight:500}}>{t.taskDeadline}: {fmtDate(task.deadline)}</span>
              </div>
              <button className="btn btn-primary btn-sm" style={{flexShrink:0}} onClick={()=>onView(task.id)}>{t.btnViewPhotos} →</button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── TaskDetailTab ────────────────────────────────────────────────────────────
function TaskDetailTab({task,tasks,t,locale,showToast,onBack}){
  const [claimTarget,setClaimTarget]=useState(null);
  const [email,setEmail]=useState("");
  const [emailError,setEmailError]=useState("");
  const openClaim=useCallback((id)=>{setClaimTarget(id);setEmail("");setEmailError("");},[]);
  const [claiming,setClaiming]=useState(false);
  const handleClaim=useCallback(async()=>{
    if(!validateEmail(email)){setEmailError(t.emailInvalid);return;}
    const emailNorm=email.trim().toLowerCase();
    const latestTask=tasks.find(tk=>tk.id===task.id)||task;
    const alreadyClaimed=(latestTask.photos||[]).filter(p=>p.claimedBy===emailNorm).length;
    if(alreadyClaimed>=3){setEmailError("每个任务最多领取3张照片");return;}
    setClaiming(true);
    try{
      const updatedPhotos=(latestTask.photos||[]).map(p=>
        p.id===claimTarget?{...p,claimedBy:emailNorm,claimedAt:Date.now()}:p
      );
      await updateDoc(doc(db,'tasks',task.id),{photos:updatedPhotos});
      setClaimTarget(null);setEmail("");setEmailError("");
      showToast(t.claimSuccess);
    }catch(err){console.error(err);showToast("领取失败，请重试","error");}
    setClaiming(false);
  },[email,claimTarget,task,tasks,t,showToast]);
  const handleDownload=useCallback((p)=>{
    if(p.url){const a=document.createElement("a");a.href=p.url;a.download=p.name;a.click();}
    else showToast(`↓ ${p.name}`);
  },[showToast]);
  const avail=task.photos.filter(p=>!p.claimedBy).length;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>‹ {t.btnBack}</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{locale==="zh"?task.name:task.nameEn}</div>
          <span className={`tag ${avail>0?"tag-green":"tag-red"}`} style={{fontSize:10,marginTop:2}}>{avail}/{task.photos.length} {t.taskAvail}</span>
        </div>
      </div>
      <p style={{fontSize:12,color:"var(--text3)",marginBottom:12}}>{t.taskDetailDesc}</p>
      {task.photos.length===0?<Empty label={t.noPhotos}/>:(
        <div className="photo-grid">
          {task.photos.map(photo=>{
            const isClaimed=!!photo.claimedBy;
            return(
              <div key={photo.id} className="photo-wrap">
                {photo.url?<img src={photo.url} alt={photo.name} className="photo-img"/>:<div className="photo-grad" style={{background:photo.gradient}}>📷</div>}
                {isClaimed&&(
                  <div className="claimed-overlay">
                    <span style={{fontSize:20}}>🔒</span>
                    <span className="claimed-badge">{t.btnClaimed}</span>
                    <button className="btn btn-sm" style={{background:"var(--success)",color:"#fff",marginTop:2,fontSize:11}} onClick={()=>handleDownload(photo)}>↓ {t.btnDownload}</button>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.7)",textAlign:"center",wordBreak:"break-all",marginTop:2}}>{photo.claimedBy}</div>
                  </div>
                )}
                <div className="photo-footer">
                  <div className="photo-name">{photo.name}</div>
                  {!isClaimed&&<button className="btn btn-primary" style={{width:"100%",minHeight:34,fontSize:12}} onClick={()=>openClaim(photo.id)}>{t.btnClaim}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim sheet */}
      {claimTarget&&(
        <div className="overlay" onClick={()=>setClaimTarget(null)}>
          <div className="sheet slide-up" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:36,height:36,background:"var(--mi-orange-light)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📷</div>
              <div>
                <div style={{fontWeight:700,fontSize:16}}>{t.claimTitle}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{task.photos.find(p=>p.id===claimTarget)?.name}</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.emailLabel}</label>
              <input className="inp" type="email" placeholder={t.emailPlaceholder} value={email} autoFocus
                onChange={e=>{setEmail(e.target.value);setEmailError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleClaim()}/>
              <p className="form-hint">{t.emailHint}</p>
              {validateEmail(email)&&(()=>{
                const latestTask=tasks.find(tk=>tk.id===task.id)||task;
                const cnt=(latestTask.photos||[]).filter(p=>p.claimedBy===email.trim().toLowerCase()).length;
                return cnt>0?<p style={{fontSize:11,color:cnt>=3?"var(--danger)":"var(--mi-orange)",marginTop:4,fontWeight:600}}>{cnt>=3?"⛔ 已达上限（3/3）":`已领取 ${cnt}/3 张`}</p>:null;
              })()}
              {emailError&&<p className="form-error">⚠️ {emailError}</p>}
            </div>
            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setClaimTarget(null)}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={handleClaim} disabled={claiming}>{claiming?"…":t.btnConfirmClaim}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MyPhotosTab ──────────────────────────────────────────────────────────────
function MyPhotosTab({allClaims,t,locale,userEmail}){
  return(
    <div>
      <div className="section-title">{t.myTitle}</div>
      {allClaims.length===0?<Empty label={t.myEmpty}/>:(
        <div className="photo-grid">
          {allClaims.map(p=>(
            <div key={p.id} className="photo-wrap">
              {p.url?<img src={p.url} alt={p.name} className="photo-img"/>:<div className="photo-grad" style={{background:p.gradient}}>📷</div>}
              <div className="photo-footer">
                <div className="photo-name">{p.name}</div>
                <div style={{fontSize:10,color:"var(--mi-orange)",fontWeight:600,marginBottom:5}}>{locale==="zh"?p.taskName:p.taskNameEn}</div>
                <button className="btn btn-ghost" style={{width:"100%",minHeight:32,fontSize:11}} onClick={()=>{if(p.url){const a=document.createElement("a");a.href=p.url;a.download=p.name;a.click();}}}>↓ {t.btnDownload}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SubmitTab ────────────────────────────────────────────────────────────────
function SubmitTab({tasks,submissions,userEmail,t,locale,showToast}){
  const [email,setEmail]=useState(userEmail||"");
  const [taskId,setTaskId]=useState("");
  const [phone,setPhone]=useState("");
  const [phoneConfirm,setPhoneConfirm]=useState("");
  const [orderNo,setOrderNo]=useState("");
  const [note,setNote]=useState("");
  const [file,setFile]=useState(null);
  const [filePreview,setFilePreview]=useState(null);
  const [errors,setErrors]=useState({});

  const emailNorm=email.trim().toLowerCase();
  const emailValid=validateEmail(email);
  const claimedTasks=emailValid?tasks.filter(tk=>tk.photos.some(p=>p.claimedBy===emailNorm)):[];
  const claimedPhotoInTask=taskId?tasks.find(tk=>tk.id===taskId)?.photos.find(p=>p.claimedBy===emailNorm):null;
  const taskSubmitCount=submissions.filter(s=>s.email===emailNorm&&s.taskId===taskId).length;
  const atLimit=taskSubmitCount>=3;

  const handleEmailChange=v=>{setEmail(v);setTaskId("");setErrors({});};

  const validate=()=>{
    const e={};
    if(!emailValid)e.email=t.emailInvalid;
    if(!taskId)e.task=t.submitNoTask;
    if(!claimedPhotoInTask)e.task=t.submitNoClaimForTask;
    if(!phone.trim())e.phone=t.submitPhoneInvalid;
    else if(!validatePhone(phone))e.phone=t.submitPhoneInvalid;
    if(phone!==phoneConfirm)e.phoneConfirm=t.submitPhoneMismatch;
    if(!orderNo.trim())e.orderNo=t.submitOrderPlaceholder;
    if(!file)e.file=t.submitNoFile;
    if(atLimit)e.limit=t.submitMax;
    return e;
  };

  const [submitting,setSubmitting]=useState(false);
  const handleSubmit=async()=>{
    const e=validate();
    if(Object.keys(e).length>0){setErrors(e);return;}
    setSubmitting(true);
    try{
      const subId=newDocId('submissions');
      showToast("上传中…");
      const workImageUrl=await uploadFile(file);
      await setDoc(doc(db,'submissions',subId),{
        email:emailNorm,taskId,note,phone:phone.trim(),orderNo:orderNo.trim(),
        claimedPhotoId:claimedPhotoInTask.id,claimedPhotoName:claimedPhotoInTask.name,
        workImageUrl,workFileName:file?.name||'',submittedAt:Date.now(),
      });
      setFile(null);setFilePreview(null);setNote("");setPhone("");setPhoneConfirm("");setOrderNo("");setErrors({});
      showToast(t.submitSuccess);
    }catch(err){console.error(err);showToast("提交失败，请重试","error");}
    setSubmitting(false);
  };

  const stepDone=(n)=>{
    if(n===1)return emailValid;
    if(n===2)return emailValid&&!!claimedPhotoInTask;
    if(n===3)return emailValid&&!!claimedPhotoInTask&&validatePhone(phone)&&phone===phoneConfirm&&orderNo.trim();
    return false;
  };

  return(
    <div>
      <div className="section-title">{t.submitTitle}</div>
      <p style={{fontSize:12,color:"var(--text3)",marginBottom:16}}>{t.submitEmailHint}</p>

      <div className="submit-grid">
        {/* ── Left: form ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Step 1 — Email */}
          <div className="section-card">
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span className={`step-dot${stepDone(1)?" done":""}`}>{stepDone(1)?"✓":"1"}</span>
              <span style={{fontWeight:600,fontSize:13}}>邮箱验证</span>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">{t.submitEmail}</label>
              <input className="inp" type="email" placeholder={t.emailPlaceholder} value={email} onChange={e=>handleEmailChange(e.target.value)}/>
              <p className="form-hint">{t.emailHint}</p>
              {errors.email&&<p className="form-error">⚠️ {errors.email}</p>}
            </div>
          </div>

          {/* Step 2 — Task */}
          <div className="section-card" style={{opacity:emailValid?1:.5,transition:"opacity .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span className={`step-dot${stepDone(1)&&!stepDone(2)?"":stepDone(2)?" done":" dim"}`}>{stepDone(2)?"✓":"2"}</span>
              <span style={{fontWeight:600,fontSize:13}}>{t.submitTask}</span>
            </div>
            {emailValid&&claimedTasks.length===0?(
              <div style={{padding:"10px 12px",background:"#FFF8E1",borderRadius:8,fontSize:13,color:"#E65100",border:"1px solid #FFE082"}}>{t.submitNoClaimForEmail}</div>
            ):(
              <select className="inp" value={taskId} disabled={!emailValid} onChange={e=>{setTaskId(e.target.value);setErrors(prev=>({...prev,task:""}));}}>
                <option value="">{t.selectTask}</option>
                {claimedTasks.map(tk=><option key={tk.id} value={tk.id}>{locale==="zh"?tk.name:tk.nameEn}</option>)}
              </select>
            )}
            {errors.task&&<p className="form-error" style={{marginTop:6}}>⚠️ {errors.task}</p>}
          </div>

          {/* Step 3 — Payment & Order */}
          <div className="section-card" style={{opacity:claimedPhotoInTask?1:.5,transition:"opacity .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span className={`step-dot${stepDone(2)&&!stepDone(3)?"":stepDone(3)?" done":" dim"}`}>{stepDone(3)?"✓":"3"}</span>
              <span style={{fontWeight:600,fontSize:13}}>收款信息</span>
            </div>

            <div className="form-group">
              <label className="form-label">{t.submitPhone}</label>
              <input className="inp" type="tel" placeholder={t.submitPhonePlaceholder} value={phone} disabled={!claimedPhotoInTask}
                onChange={e=>{setPhone(e.target.value);setErrors(prev=>({...prev,phone:"",phoneConfirm:""}));}}/>
              {errors.phone&&<p className="form-error">⚠️ {errors.phone}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">{t.submitPhoneConfirm}</label>
              <input className="inp" type="tel" placeholder={t.submitPhoneConfirmPlaceholder} value={phoneConfirm} disabled={!claimedPhotoInTask}
                onChange={e=>{setPhoneConfirm(e.target.value);setErrors(prev=>({...prev,phoneConfirm:""}));}}/>
              {errors.phoneConfirm&&<p className="form-error">⚠️ {errors.phoneConfirm}</p>}
              {phone&&phoneConfirm&&phone===phoneConfirm&&<p style={{fontSize:11,color:"var(--success)",marginTop:4}}>✓ 号码一致</p>}
            </div>

            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">{t.submitOrderNo}</label>
              <input className="inp" type="text" placeholder={t.submitOrderPlaceholder} value={orderNo} disabled={!claimedPhotoInTask}
                onChange={e=>{setOrderNo(e.target.value);setErrors(prev=>({...prev,orderNo:""}));}}/>
              {errors.orderNo&&<p className="form-error">⚠️ {errors.orderNo}</p>}
            </div>
          </div>

          {/* Step 4 — Upload */}
          <div className="section-card" style={{opacity:claimedPhotoInTask?1:.5,transition:"opacity .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span className={`step-dot ${claimedPhotoInTask?"":"dim"}`}>4</span>
              <span style={{fontWeight:600,fontSize:13}}>{t.submitFile}</span>
            </div>
            <WorkUploadButton
              file={file}
              filePreview={filePreview}
              disabled={!claimedPhotoInTask}
              t={t}
              onSelect={(f,preview)=>{
                setFile(f);
                setFilePreview(preview);
                setErrors(prev=>({...prev,file:""}));
              }}
            />
            {errors.file&&<p className="form-error" style={{marginTop:6}}>⚠️ {errors.file}</p>}

            <div className="form-group" style={{marginTop:14,marginBottom:0}}>
              <label className="form-label">{t.submitNote}</label>
              <textarea className="inp" rows={2} placeholder={t.submitNotePlaceholder} disabled={!claimedPhotoInTask}
                value={note} onChange={e=>setNote(e.target.value)} style={{resize:"vertical"}}/>
            </div>
          </div>

          {/* Limit badge */}
          {claimedPhotoInTask&&(
            <div style={{padding:"10px 14px",background:atLimit?"#FFEBEE":"#E8F5E9",borderRadius:8,fontSize:12,fontWeight:600,color:atLimit?"var(--danger)":"#2E7D32",display:"flex",alignItems:"center",gap:6}}>
              {atLimit?"⛔":"✅"} {t.submitCount}: {taskSubmitCount}/3 {atLimit&&`— ${t.submitMax}`}
            </div>
          )}

          {/* Submit button */}
          <button className="btn btn-primary" disabled={!claimedPhotoInTask||atLimit||!file||submitting} onClick={handleSubmit}
            style={{width:"100%",minHeight:50,fontSize:15,fontWeight:700,borderRadius:12}}>
            {submitting?"上传中…":t.btnSubmit}
          </button>
        </div>

        {/* ── Right: task selector + preview ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {emailValid&&(
            <div className="section-card">
              <div className="section-card-title">{t.submitClaimedTask}</div>
              {claimedTasks.length===0?<p style={{fontSize:13,color:"var(--text3)",fontStyle:"italic"}}>{t.submitNoClaimedTasks}</p>:(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {claimedTasks.map(tk=>{
                    const photo=tk.photos.find(p=>p.claimedBy===emailNorm);
                    const cnt=submissions.filter(s=>s.email===emailNorm&&s.taskId===tk.id).length;
                    const sel=tk.id===taskId;
                    return(
                      <div key={tk.id} onClick={()=>{setTaskId(tk.id);setErrors(prev=>({...prev,task:""}));}}
                        style={{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",borderRadius:10,border:`2px solid ${sel?"var(--mi-orange)":"var(--border)"}`,background:sel?"var(--mi-orange-light)":"var(--surface2)",cursor:"pointer",transition:"all .15s"}}>
                        <div style={{width:38,height:38,borderRadius:6,overflow:"hidden",flexShrink:0}}>
                          {photo?.url?<img src={photo.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:photo?.gradient}}/>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13}}>{locale==="zh"?tk.name:tk.nameEn}</div>
                          <div style={{fontSize:10,color:"var(--text3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{photo?.name}</div>
                        </div>
                        <span className={`tag ${cnt>=3?"tag-red":cnt>0?"tag-orange":"tag-green"}`}>{cnt}/3</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {claimedPhotoInTask&&(
            <div className="section-card">
              <div className="section-card-title">{t.submitPhotoInfo}</div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:60,height:60,borderRadius:8,overflow:"hidden",flexShrink:0}}>
                  {claimedPhotoInTask.url?<img src={claimedPhotoInTask.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<div style={{width:"100%",height:"100%",background:claimedPhotoInTask.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📷</div>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{claimedPhotoInTask.name}</div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>{claimedPhotoInTask.claimedBy}</div>
                </div>
              </div>
            </div>
          )}

          {!emailValid&&(
            <div style={{padding:"36px 20px",textAlign:"center",border:"2px dashed var(--border)",borderRadius:12,color:"var(--text3)"}}>
              <div style={{fontSize:36,marginBottom:10}}>📧</div>
              <p style={{fontSize:13}}>{t.submitEmailHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({label}){
  return(
    <div style={{padding:"52px 20px",textAlign:"center",color:"var(--text3)",border:"2px dashed var(--border)",borderRadius:12}}>
      <div style={{fontSize:36,marginBottom:10,opacity:.4}}>📭</div>
      <p style={{fontSize:13}}>{label}</p>
    </div>
  );
}

// ─── AdminView ────────────────────────────────────────────────────────────────
function AdminView({tasks,allClaims,submissions,t,locale,showToast}){
  const [tab,setTab]=useState("overview");
  return(
    <div className="admin-page">
      <div className="admin-inner">
        <div style={{marginBottom:16,marginTop:4}}>
          <div style={{fontSize:20,fontWeight:800,color:"var(--text)"}}>管理中心</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>Admin Dashboard</div>
        </div>
        <div className="admin-tabs">
          {[["overview","📊",t.adOverview],["tasks","📋",t.adTasks],["claims","🔒",t.adClaims],["submissions","📤",t.adSubmissions]].map(([k,ic,lbl])=>(
            <button key={k} className={`admin-tab${tab===k?" active":""}`} onClick={()=>setTab(k)}>{ic} {lbl}</button>
          ))}
        </div>
        <div className="fade-in" key={tab}>
          {tab==="overview"&&<AdminOverview tasks={tasks} allClaims={allClaims} submissions={submissions} t={t}/>}
          {tab==="tasks"&&<AdminTasks tasks={tasks} t={t} locale={locale} showToast={showToast}/>}
          {tab==="claims"&&<AdminClaims tasks={tasks} t={t} locale={locale} showToast={showToast}/>}
          {tab==="submissions"&&<AdminSubmissions submissions={submissions} tasks={tasks} t={t} locale={locale} showToast={showToast}/>}
        </div>
      </div>
    </div>
  );
}

function AdminOverview({tasks,allClaims,submissions,t}){
  const total=tasks.reduce((s,tk)=>s+tk.photos.length,0);
  const stats=[
    {lbl:t.ovPhotoTotal,val:total,color:"var(--text)"},
    {lbl:t.ovClaimed,val:allClaims.length,color:"var(--mi-orange)"},
    {lbl:t.ovSubmissions,val:submissions.length,color:"var(--success)"},
    {lbl:t.ovTasks,val:tasks.length,color:"var(--info)"},
  ];
  return(
    <div className="stat-grid">
      {stats.map((s,i)=>(
        <div key={i} className="stat-card" style={{borderLeft:`4px solid ${s.color}`}}>
          <div className="stat-num" style={{color:s.color}}>{s.val}</div>
          <div className="stat-label">{s.lbl}</div>
        </div>
      ))}
    </div>
  );
}

// ─── AdminTasks ───────────────────────────────────────────────────────────────
function AdminTasks({tasks,t,locale,showToast}){
  const [form,setForm]=useState(null);
  const [delConfirm,setDelConfirm]=useState(null);
  const [search,setSearch]=useState("");
  const [selectMode,setSelectMode]=useState(false);
  const [selected,setSelected]=useState({});
  const [bulkDelConfirm,setBulkDelConfirm]=useState(false);
  const [bulkDeleting,setBulkDeleting]=useState(false);
  const filtered=tasks.filter(tk=>fuzzyMatch(tk.name+" "+tk.nameEn+" "+tk.desc,search));
  const openAdd=useCallback(()=>setForm({name:"",nameEn:"",deadline:"",desc:"",photos:[]}),[]);
  const openEdit=useCallback((tk)=>setForm({...tk,photos:tk.photos.map(p=>({...p}))}),[]);
  const updateForm=useCallback((k,v)=>setForm(prev=>({...prev,[k]:v})),[]);
  const toggleSelect=(id)=>setSelected(prev=>{const n={...prev};if(n[id])delete n[id];else n[id]=true;return n;});
  const selectAll=()=>setSelected(filtered.reduce((a,tk)=>{a[tk.id]=true;return a;},{}));
  const clearSelect=()=>setSelected({});
  const selectedCount=Object.keys(selected).length;
  const handleBulkDelete=useCallback(async()=>{
    setBulkDeleting(true);
    try{
      for(const id of Object.keys(selected)){
        await deleteDoc(doc(db,'tasks',id));
      }
      showToast(`✓ 已删除 ${selectedCount} 个任务`);
      setSelected({});setSelectMode(false);setBulkDelConfirm(false);
    }catch(err){console.error(err);showToast("批量删除失败","error");}
    setBulkDeleting(false);
  },[selected,selectedCount,showToast]);
  const [saving,setSaving]=useState(false);
  const handleSave=useCallback(async()=>{
    if(!form.name||!form.deadline)return;
    setSaving(true);
    try{
      const taskId=form.id||newDocId('tasks');
      const allPhotos=form.photos||[];
      const needUpload=allPhotos.filter(p=>p._file).length;
      const photos=[];
      let uploaded=0;
      for(const p of allPhotos){
        if(p._file){
          uploaded++;
          showToast(`上传中 ${uploaded}/${needUpload}`);
          const url=await uploadFile(p._file);
          const{_file,_preview,...rest}=p;
          photos.push({...rest,url});
        }else{
          const{_file,_preview,...rest}=p;
          photos.push(rest);
        }
      }
      showToast("保存中…");
      await setDoc(doc(db,'tasks',taskId),{
        name:form.name,nameEn:form.nameEn||'',deadline:form.deadline,
        desc:form.desc||'',photos,
      },{merge:true});
      setForm(null);showToast("✓ 已保存");
    }catch(err){console.error(err);showToast("保存失败","error");}
    setSaving(false);
  },[form,showToast]);
  const handleDelete=useCallback(async(id)=>{
    try{await deleteDoc(doc(db,'tasks',id));setDelConfirm(null);showToast("✓ 已删除");}
    catch(err){console.error(err);showToast("删除失败","error");}
  },[showToast]);

  return(
    <div>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}><SearchBar value={search} onChange={setSearch} placeholder={t.searchPlaceholder}/></div>
        <button className={`btn btn-sm ${selectMode?"btn-primary":""}`} style={{fontSize:12,padding:"5px 12px"}}
          onClick={()=>{setSelectMode(v=>!v);setSelected({});}}>
          {selectMode?"退出选择":"批量选择"}
        </button>
        {!selectMode&&<button className="btn btn-primary btn-sm" onClick={openAdd} style={{flexShrink:0}}>+ {t.btnAddTask}</button>}
      </div>
      {selectMode&&(
        <div style={{background:"#FFF3E0",border:"1px solid #FFB74D",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:600,color:"var(--mi-orange)",flex:1}}>已选 {selectedCount} 个任务</span>
          <button className="btn btn-xs btn-ghost" onClick={selectAll}>全选</button>
          <button className="btn btn-xs btn-ghost" onClick={clearSelect}>清空</button>
          {selectedCount>0&&<button className="btn btn-xs" style={{background:"var(--danger)",color:"#fff",fontWeight:700}}
            onClick={()=>setBulkDelConfirm(true)}>🗑 批量删除</button>}
        </div>
      )}
      {filtered.length===0?<Empty label={search?t.searchNoResult:t.noData}/>:(
        filtered.map(tk=>{
          const avail=tk.photos.filter(p=>!p.claimedBy).length;
          const isSel=!!selected[tk.id];
          return(
            <div key={tk.id} style={{background:isSel?"#FFF8E1":"var(--surface)",borderRadius:12,padding:"12px 14px",marginBottom:10,boxShadow:"var(--shadow-sm)",display:"flex",gap:12,alignItems:"center",border:isSel?"1.5px solid var(--mi-orange)":"1.5px solid transparent"}}>
              {selectMode&&<input type="checkbox" checked={isSel} onChange={()=>toggleSelect(tk.id)}
                style={{width:18,height:18,accentColor:"var(--mi-orange)",flexShrink:0}}/>}
              <div style={{display:"flex",gap:3,flexShrink:0}}>
                {tk.photos.slice(0,2).map(p=>(
                  <div key={p.id} style={{width:36,height:36,borderRadius:6,overflow:"hidden"}}>
                    {p.url?<img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:p.gradient}}/>}
                  </div>
                ))}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{locale==="zh"?tk.name:tk.nameEn}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>
                  {fmtDate(tk.deadline)} · <span className="tag tag-orange" style={{fontSize:10}}>{avail}/{tk.photos.length}</span>
                </div>
              </div>
              {!selectMode&&<div style={{display:"flex",gap:6,flexShrink:0}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(tk)}>{t.btnEdit}</button>
                <button className="btn btn-danger" style={{minHeight:36}} onClick={()=>setDelConfirm(tk.id)}>✕</button>
              </div>}
            </div>
          );
        })
      )}
      {bulkDelConfirm&&(
        <div className="overlay overlay-center" onClick={()=>setBulkDelConfirm(false)}>
          <div className="dialog scale-in" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🗑</div>
            <p style={{fontSize:14,textAlign:"center",fontWeight:600,marginBottom:8}}>删除 {selectedCount} 个任务？</p>
            <p style={{fontSize:12,color:"var(--text3)",textAlign:"center",marginBottom:20}}>任务内所有图片和领取记录将一并删除，不可恢复</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setBulkDelConfirm(false)} disabled={bulkDeleting}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2,background:"var(--danger)"}} disabled={bulkDeleting}
                onClick={handleBulkDelete}>{bulkDeleting?"删除中…":"🗑 确认删除"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Task form sheet */}
      {form!==null&&(
        <div className="overlay" onClick={()=>setForm(null)}>
          <div className="sheet slide-up" style={{maxHeight:"96vh"}} onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div style={{fontSize:16,fontWeight:700,marginBottom:20}}>{form.id?`✏️ ${t.btnEdit}`:`➕ ${t.btnAddTask}`}</div>
            {[{lbl:t.taskNameLabel+" (中文)",k:"name",type:"text"},{lbl:t.taskNameLabel+" (EN)",k:"nameEn",type:"text"},{lbl:t.taskDeadlineLabel,k:"deadline",type:"date"}].map(({lbl,k,type})=>(
              <div key={k} className="form-group">
                <label className="form-label">{lbl}</label>
                <input className="inp" type={type} value={form[k]||""} onChange={e=>updateForm(k,e.target.value)}/>
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">{t.taskDescLabel}</label>
              <textarea className="inp" rows={2} value={form.desc||""} onChange={e=>updateForm("desc",e.target.value)} style={{resize:"vertical"}}/>
            </div>
            <div className="divider"/>
            <div className="form-group">
              <label className="form-label" style={{display:"flex",alignItems:"center",gap:8}}>
                {t.uploadPhotos}
                {form.photos.length>0&&<span className="tag tag-orange">{form.photos.length} {t.uploadedCount}</span>}
              </label>
              <PhotoUploadZone photos={form.photos} onPhotosChange={newVal=>updateForm("photos", typeof newVal==="function"?newVal(form.photos):newVal)} t={t}/>
            </div>
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setForm(null)}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2,fontWeight:700}} onClick={handleSave} disabled={saving}>{saving?"保存中…":t.btnSave}</button>
            </div>
          </div>
        </div>
      )}
      {delConfirm!==null&&<ConfirmDialog msg={t.confirmDelete} onConfirm={()=>handleDelete(delConfirm)} onCancel={()=>setDelConfirm(null)} t={t}/>}
    </div>
  );
}

// ─── PhotoUploadZone ──────────────────────────────────────────────────────────
function PhotoUploadZone({photos,onPhotosChange,t}){
  const inputRef=useRef();
  const [drag,setDrag]=useState(false);
  const photosRef=useRef(photos);
  photosRef.current=photos;

  const processFiles=useCallback((files)=>{
    const arr=Array.from(files).filter(f=>f.type.startsWith("image/"));
    if(!arr.length)return;
    const newPhotos=arr.map(file=>({
      id:uid(),name:file.name,url:null,
      _preview:URL.createObjectURL(file),
      _file:file,
      gradient:GRADIENTS[Math.floor(Math.random()*GRADIENTS.length)],
      claimedBy:null,claimedAt:null,
    }));
    onPhotosChange([...photosRef.current,...newPhotos]);
  },[onPhotosChange]);

  return(
    <div>
      <div className={`upload-zone${drag?" drag":""}`}
        onClick={()=>inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);processFiles(e.dataTransfer.files);}}>
        <div style={{fontSize:28,marginBottom:6}}>🖼️</div>
        <div style={{fontSize:12,color:"var(--text3)",fontWeight:500}}>{t.uploadHint}</div>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{processFiles(e.target.files);e.target.value="";}}/>
      </div>
      {photos.length>0&&(
        <div className="up-grid">
          {photos.map(p=>(
            <div key={p.id} className="up-item">
              {(p._preview||p.url)?<img src={p._preview||p.url} alt={p.name} className="up-img"/>:<div className="up-grad" style={{background:p.gradient||GRADIENTS[0]}}/>}
              <button className="up-rm" onClick={()=>onPhotosChange(photos.filter(x=>x.id!==p.id))}>✕</button>
              {p.claimedBy&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,200,83,.85)",color:"#fff",fontSize:9,padding:"2px",textAlign:"center",borderRadius:"0 0 6px 6px"}}>🔒</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WorkUploadButton (user submit) ──────────────────────────────────────────
function WorkUploadButton({file,filePreview,onSelect,disabled,t}){
  const ref=useRef();
  return(
    <div>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}}
        onChange={e=>{
          const f=e.target.files[0];if(!f)return;
          const r=new FileReader();
          r.onload=ev=>onSelect(f,ev.target.result);
          r.readAsDataURL(f);
          e.target.value="";
        }}/>
      {!filePreview?(
        <div onClick={()=>!disabled&&ref.current?.click()}
          style={{border:"2px dashed var(--border)",borderRadius:10,padding:"24px 16px",textAlign:"center",cursor:disabled?"not-allowed":"pointer",background:disabled?"var(--bg)":"var(--surface2)",opacity:disabled?0.45:1,transition:"all .2s"}}
          onMouseEnter={e=>{if(!disabled)e.currentTarget.style.borderColor="var(--mi-orange)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";}}>
          <div style={{fontSize:36,marginBottom:8}}>📷</div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:4}}>点击上传作品图片</div>
          <div style={{fontSize:11,color:"var(--text3)"}}>支持 JPG / PNG / WEBP</div>
        </div>
      ):(
        <div style={{position:"relative",borderRadius:10,overflow:"hidden",border:"2px solid var(--mi-orange)"}}>
          <img src={filePreview} alt="preview" style={{width:"100%",maxHeight:200,objectFit:"cover",display:"block"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.55)",padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <span style={{fontSize:11,color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{file?.name}</span>
            <button onClick={e=>{e.stopPropagation();if(!disabled)ref.current?.click();}}
              style={{background:"var(--mi-orange)",border:"none",color:"#fff",fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:6,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
              重选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AdminClaims ──────────────────────────────────────────────────────────────
function AdminClaims({tasks,t,locale,showToast}){
  const [search,setSearch]=useState("");
  const [expanded,setExpanded]=useState({});
  const [resetConfirm,setResetConfirm]=useState(null);
  const [bulkConfirm,setBulkConfirm]=useState(null); // {taskId,scope:'task'|'all'}
  const [selected,setSelected]=useState({}); // {photoKey: {taskId,photoId}} where photoKey=taskId+photoId
  const [selectMode,setSelectMode]=useState(false);
  const [lightbox,setLightbox]=useState(null);
  const [resetting,setResetting]=useState(false);
  const toggleExpand=useCallback((id)=>setExpanded(prev=>({...prev,[id]:!prev[id]})),[]);

  const handleReset=useCallback(async({taskId,photoId})=>{
    try{
      const task=tasks.find(tk=>tk.id===taskId);
      const updatedPhotos=(task?.photos||[]).map(p=>
        p.id===photoId?{...p,claimedBy:null,claimedAt:null}:p
      );
      await updateDoc(doc(db,'tasks',taskId),{photos:updatedPhotos});
      setResetConfirm(null);showToast(t.resetSuccess);
    }catch(err){console.error(err);showToast("重置失败","error");}
  },[tasks,t,showToast]);

  // Bulk reset selected photos
  const handleBulkReset=useCallback(async()=>{
    setResetting(true);
    try{
      // Group selected by taskId
      const byTask={};
      Object.values(selected).forEach(({taskId,photoId})=>{
        if(!byTask[taskId])byTask[taskId]=[];
        byTask[taskId].push(photoId);
      });
      for(const [taskId,photoIds] of Object.entries(byTask)){
        const task=tasks.find(tk=>tk.id===taskId);
        const updatedPhotos=(task?.photos||[]).map(p=>
          photoIds.includes(p.id)?{...p,claimedBy:null,claimedAt:null}:p
        );
        await updateDoc(doc(db,'tasks',taskId),{photos:updatedPhotos});
      }
      showToast(`✓ 已重置 ${Object.keys(selected).length} 张`);
      setSelected({});setSelectMode(false);setBulkConfirm(null);
    }catch(err){console.error(err);showToast("批量重置失败","error");}
    setResetting(false);
  },[selected,tasks,showToast]);

  // Reset all claimed in a task
  const handleResetTask=useCallback(async(taskId)=>{
    setResetting(true);
    try{
      const task=tasks.find(tk=>tk.id===taskId);
      const updatedPhotos=(task?.photos||[]).map(p=>({...p,claimedBy:null,claimedAt:null}));
      await updateDoc(doc(db,'tasks',taskId),{photos:updatedPhotos});
      showToast("✓ 已重置该任务所有领取");setBulkConfirm(null);
    }catch(err){console.error(err);showToast("重置失败","error");}
    setResetting(false);
  },[tasks,showToast]);

  const toggleSelect=(taskId,photoId)=>{
    const key=taskId+photoId;
    setSelected(prev=>{
      const n={...prev};
      if(n[key])delete n[key]; else n[key]={taskId,photoId};
      return n;
    });
  };
  const selectAllInTask=(task)=>{
    const claimed=task.photos.filter(p=>p.claimedBy);
    const allSelected=claimed.every(p=>selected[task.id+p.id]);
    if(allSelected){
      setSelected(prev=>{const n={...prev};claimed.forEach(p=>delete n[task.id+p.id]);return n;});
    } else {
      setSelected(prev=>{const n={...prev};claimed.forEach(p=>{n[task.id+p.id]={taskId:task.id,photoId:p.id};});return n;});
    }
  };

  const selectedCount=Object.keys(selected).length;
  const visibleTasks=tasks.filter(tk=>fuzzyMatch(tk.name+" "+tk.nameEn+" "+tk.desc,search)).filter(tk=>tk.photos.some(p=>p.claimedBy));
  const totalClaimed=tasks.reduce((s,tk)=>s+tk.photos.filter(p=>p.claimedBy).length,0);

  return(
    <div>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}><SearchBar value={search} onChange={setSearch} placeholder={t.searchPlaceholder}/></div>
        <span className="tag tag-orange">{totalClaimed} {locale==="zh"?"已领取":"claimed"}</span>
        <button className={`btn btn-sm ${selectMode?"btn-primary":""}`} style={{fontSize:12,padding:"5px 12px"}}
          onClick={()=>{setSelectMode(v=>!v);setSelected({});}}>
          {selectMode?"退出选择":"批量选择"}
        </button>
      </div>
      {selectMode&&selectedCount>0&&(
        <div style={{background:"#FFF3E0",border:"1px solid #FFB74D",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:600,color:"var(--mi-orange)"}}>已选 {selectedCount} 张</span>
          <button className="btn btn-sm" style={{background:"#E65100",color:"#fff",fontSize:12,fontWeight:700}}
            onClick={()=>setBulkConfirm({scope:"selected"})}>
            ↺ 批量重置所选
          </button>
        </div>
      )}
      {visibleTasks.length===0?<Empty label={search?t.searchNoResult:t.noClaimedPhotos}/>:(
        visibleTasks.map(task=>{
          const claimed=task.photos.filter(p=>p.claimedBy);
          const isExp=expanded[task.id]!==false;
          const allTaskSelected=claimed.length>0&&claimed.every(p=>selected[task.id+p.id]);
          return(
            <div key={task.id} className="claim-group">
              <div className="claim-group-hdr" onClick={()=>toggleExpand(task.id)}>
                <div style={{display:"flex",gap:3,flexShrink:0}}>
                  {claimed.slice(0,3).map(p=>(
                    <div key={p.id} style={{width:36,height:36,borderRadius:6,overflow:"hidden",position:"relative"}}>
                      {p.url?<img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:p.gradient}}/>}
                      <div style={{position:"absolute",bottom:2,right:2,width:7,height:7,borderRadius:"50%",background:"var(--success)",border:"1px solid #fff"}}/>
                    </div>
                  ))}
                  {claimed.length>3&&<div style={{width:36,height:36,borderRadius:6,background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--text3)"}}>+{claimed.length-3}</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{locale==="zh"?task.name:task.nameEn}</div>
                  <div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>{fmtDate(task.deadline)}</div>
                </div>
                <span className="tag tag-orange" style={{flexShrink:0}}>🔒 {claimed.length}/{task.photos.length}</span>
                {selectMode&&(
                  <button className="btn btn-xs" style={{fontSize:10,background:allTaskSelected?"var(--mi-orange)":"var(--bg)",color:allTaskSelected?"#fff":"var(--text3)",border:"1px solid var(--border)",marginLeft:4}}
                    onClick={e=>{e.stopPropagation();selectAllInTask(task);}}>
                    {allTaskSelected?"取消全选":"全选"}
                  </button>
                )}
                {!selectMode&&(
                  <button className="btn btn-xs" style={{fontSize:10,color:"#E65100",borderColor:"#FFCCBC",marginLeft:4}}
                    onClick={e=>{e.stopPropagation();setBulkConfirm({scope:"task",taskId:task.id,taskName:task.name,count:claimed.length});}}>
                    ↺ 重置全部
                  </button>
                )}
                <span style={{color:"var(--text3)",fontSize:16,transform:isExp?"rotate(90deg)":"none",transition:"transform .2s",display:"inline-block",marginLeft:4}}>›</span>
              </div>
              {isExp&&claimed.map(p=>(
                <div key={p.id} className="claim-row" style={{flexWrap:"wrap",gap:8,background:selected[task.id+p.id]?"#FFF8E1":""}}>
                  {selectMode&&(
                    <input type="checkbox" checked={!!selected[task.id+p.id]} onChange={()=>toggleSelect(task.id,p.id)}
                      style={{width:16,height:16,accentColor:"var(--mi-orange)",flexShrink:0,alignSelf:"center"}}/>
                  )}
                  <div onClick={()=>setLightbox(p)} style={{width:42,height:42,borderRadius:6,overflow:"hidden",flexShrink:0,cursor:"zoom-in"}}>
                    {p.url?<img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:p.gradient}}/>}
                  </div>
                  <div style={{flex:1,minWidth:100}}>
                    <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"var(--success)",marginTop:2,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>● {p.claimedBy}</div>
                    <div style={{fontSize:10,color:"var(--text3)",marginTop:1}}>{fmtTime(p.claimedAt)}</div>
                  </div>
                  {!selectMode&&(
                    <button className="btn btn-ghost btn-xs" style={{flexShrink:0,color:"var(--mi-orange)",borderColor:"#FFB380"}}
                      onClick={()=>setResetConfirm({taskId:task.id,photoId:p.id,photoName:p.name,email:p.claimedBy})}>
                      ↺ {t.btnReset}
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })
      )}
      {resetConfirm&&(
        <div className="overlay overlay-center" onClick={()=>setResetConfirm(null)}>
          <div className="dialog scale-in" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>↺</div>
            <p style={{fontSize:14,textAlign:"center",fontWeight:600,marginBottom:8}}>{t.confirmReset}</p>
            <div style={{background:"var(--bg)",borderRadius:8,padding:"10px 14px",marginBottom:20}}>
              <div style={{fontSize:11,color:"var(--text3)",fontWeight:500}}>{resetConfirm.photoName}</div>
              <div style={{fontSize:13,color:"var(--success)",fontWeight:700,marginTop:2}}>{resetConfirm.email}</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setResetConfirm(null)}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2,background:"#E65100"}} onClick={()=>handleReset(resetConfirm)}>↺ {t.btnReset}</button>
            </div>
          </div>
        </div>
      )}
      {bulkConfirm&&(
        <div className="overlay overlay-center" onClick={()=>setBulkConfirm(null)}>
          <div className="dialog scale-in" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>↺</div>
            <p style={{fontSize:14,textAlign:"center",fontWeight:600,marginBottom:8}}>
              {bulkConfirm.scope==="task"?`重置「${bulkConfirm.taskName}」全部 ${bulkConfirm.count} 张领取？`:`重置已选 ${selectedCount} 张领取？`}
            </p>
            <p style={{fontSize:12,color:"var(--text3)",textAlign:"center",marginBottom:20}}>此操作不可恢复</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setBulkConfirm(null)} disabled={resetting}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2,background:"#E65100"}} disabled={resetting}
                onClick={()=>bulkConfirm.scope==="task"?handleResetTask(bulkConfirm.taskId):handleBulkReset()}>
                {resetting?"重置中…":"↺ 确认重置"}
              </button>
            </div>
          </div>
        </div>
      )}
      {lightbox&&(
        <div className="overlay" onClick={()=>setLightbox(null)}>
          <div className="lightbox slide-up" onClick={e=>e.stopPropagation()}>
            {lightbox.url?<img src={lightbox.url} alt={lightbox.name} style={{width:"100%",maxHeight:"62vh",objectFit:"contain",display:"block",borderRadius:"20px 20px 0 0"}}/>
              :<div style={{height:240,background:lightbox.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:56,borderRadius:"20px 20px 0 0"}}>📷</div>}
            <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,color:"#fff",fontWeight:700}}>{lightbox.name}</div>
                <div style={{fontSize:11,color:"#999",marginTop:3}}>🔒 {lightbox.claimedBy}</div>
              </div>
              <button onClick={()=>setLightbox(null)} style={{background:"#333",border:"none",color:"#ccc",padding:"6px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AdminSubmissions ─────────────────────────────────────────────────────────
function AdminSubmissions({submissions,tasks,t,locale,showToast}){
  const [delConfirm,setDelConfirm]=useState(null);
  const [selectMode,setSelectMode]=useState(false);
  const [selected,setSelected]=useState({});
  const [bulkDelConfirm,setBulkDelConfirm]=useState(false);
  const [bulkDeleting,setBulkDeleting]=useState(false);
  // workLightbox: { taskId, idx }  — idx is index within that task's image-having subs
  const [workLightbox,setWorkLightbox]=useState(null);
  const [exportOpen,setExportOpen]=useState(false);

  // Open lightbox for a specific submission, scoped to its task
  const openLightbox=useCallback((s,taskSubs)=>{
    const imgSubs=taskSubs.filter(x=>x.workImageUrl);
    const idx=imgSubs.findIndex(x=>x.id===s.id);
    if(idx<0)return;
    setWorkLightbox({taskId:s.taskId,idx,imgSubs});
  },[]);

  const lbSub=workLightbox?workLightbox.imgSubs[workLightbox.idx]:null;
  const lbTask=workLightbox?tasks.find(tk=>tk.id===workLightbox.taskId):null;
  const lbTotal=workLightbox?workLightbox.imgSubs.length:0;
  const lbPrev=()=>setWorkLightbox(prev=>prev&&prev.idx>0?{...prev,idx:prev.idx-1}:prev);
  const lbNext=()=>setWorkLightbox(prev=>prev&&prev.idx<prev.imgSubs.length-1?{...prev,idx:prev.idx+1}:prev);

  // Keyboard navigation for lightbox
  useState(()=>{
    const handler=(e)=>{
      if(!workLightbox)return;
      if(e.key==="ArrowLeft")lbPrev();
      if(e.key==="ArrowRight")lbNext();
      if(e.key==="Escape")setWorkLightbox(null);
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  });
  const [selTasks,setSelTasks]=useState([]);
  const [selCols,setSelCols]=useState(["email","phone","orderNo","imageCount","note","time"]);
  const [expandedTasks,setExpandedTasks]=useState({});

  const handleDelete=useCallback(async(id)=>{
    try{await deleteDoc(doc(db,'submissions',id));setDelConfirm(null);showToast("✓ 已删除");}
    catch(err){console.error(err);showToast("删除失败","error");}
  },[showToast]);
  const toggleSelect=(id)=>setSelected(prev=>{const n={...prev};if(n[id])delete n[id];else n[id]=true;return n;});
  const selectedCount=Object.keys(selected).length;
  const handleBulkDelete=useCallback(async()=>{
    setBulkDeleting(true);
    try{
      for(const id of Object.keys(selected)){
        await deleteDoc(doc(db,'submissions',id));
      }
      showToast(`✓ 已删除 ${selectedCount} 条记录`);
      setSelected({});setSelectMode(false);setBulkDelConfirm(false);
    }catch(err){console.error(err);showToast("批量删除失败","error");}
    setBulkDeleting(false);
  },[selected,selectedCount,showToast]);
  const selectAllInTask=(taskSubs)=>{
    const allSel=taskSubs.every(s=>selected[s.id]);
    setSelected(prev=>{
      const n={...prev};
      if(allSel)taskSubs.forEach(s=>delete n[s.id]);
      else taskSubs.forEach(s=>{n[s.id]=true;});
      return n;
    });
  };

  const toggleTaskExpand=useCallback((id)=>setExpandedTasks(prev=>({...prev,[id]:prev[id]===false?true:false})),[]);

  // Group submissions by task
  const tasksWithSubs=tasks.map(tk=>({
    ...tk,
    subs:submissions.filter(s=>s.taskId===tk.id),
  })).filter(tk=>tk.subs.length>0);

  // All column definitions
  const ALL_COLS=[
    {key:"email",label:t.exportColEmail},
    {key:"phone",label:t.exportColPhone},
    {key:"orderNo",label:t.exportColOrder},
    {key:"imageCount",label:t.exportColImages},
    {key:"note",label:t.exportColNote},
    {key:"time",label:t.exportColTime},
  ];

  // Open export panel — preselect all tasks
  const openExport=()=>{
    setSelTasks(tasksWithSubs.map(tk=>tk.id));
    setSelCols(["email","phone","orderNo","imageCount","note","time"]);
    setExportOpen(true);
  };

  const toggleSelTask=(id)=>setSelTasks(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const toggleSelCol=(k)=>setSelCols(prev=>prev.includes(k)?prev.filter(x=>x!==k):[...prev,k]);

  // Build and download Excel
  const handleExport=()=>{
    if(selTasks.length===0){showToast(t.exportNoTask,"error");return;}
    if(selCols.length===0){showToast(t.exportNoCol,"error");return;}

    const wb=XLSX.utils.book_new();

    selTasks.forEach(tid=>{
      const task=tasks.find(tk=>tk.id===tid);
      if(!task)return;
      const taskSubs=submissions.filter(s=>s.taskId===tid);
      if(taskSubs.length===0)return;

      // Header row
      const header=ALL_COLS.filter(c=>selCols.includes(c.key)).map(c=>c.label);
      const rows=taskSubs.map(s=>{
        const row=[];
        ALL_COLS.filter(c=>selCols.includes(c.key)).forEach(c=>{
          if(c.key==="email")row.push(s.email||"");
          else if(c.key==="phone")row.push(s.phone||"");
          else if(c.key==="orderNo")row.push(s.orderNo||"");
          else if(c.key==="imageCount")row.push(s.workImageUrl?1:0);
          else if(c.key==="note")row.push(s.note||"");
          else if(c.key==="time")row.push(fmtTime(s.submittedAt));
        });
        return row;
      });

      const wsData=[header,...rows];
      const ws=XLSX.utils.aoa_to_sheet(wsData);

      // Column widths
      ws["!cols"]=header.map(()=>({wch:20}));

      // Style header row (bold via cell metadata — basic xlsx)
      header.forEach((_,ci)=>{
        const cellAddr=XLSX.utils.encode_cell({r:0,c:ci});
        if(ws[cellAddr]){ws[cellAddr].s={font:{bold:true},fill:{fgColor:{rgb:"FF6900"}}};}
      });

      const sheetName=(locale==="zh"?task.name:task.nameEn).slice(0,31);
      XLSX.utils.book_append_sheet(wb,ws,sheetName);
    });

    if(wb.SheetNames.length===0){showToast(t.exportEmpty,"error");return;}

    const date=new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb,`submissions_${date}.xlsx`);
    setExportOpen(false);
    showToast("✓ 导出成功");
  };

  return(
    <div>
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:8,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>{t.adSubmissions}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{submissions.length} 条提交记录 · {tasksWithSubs.length} 个任务</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className={`btn btn-sm ${selectMode?"btn-primary":""}`} style={{fontSize:12,padding:"5px 12px"}}
            onClick={()=>{setSelectMode(v=>!v);setSelected({});}}>
            {selectMode?"退出选择":"批量选择"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openExport} disabled={submissions.length===0}
            style={{display:"flex",alignItems:"center",gap:6}}>
            <span>📊</span> {t.btnExport}
          </button>
        </div>
      </div>
      {selectMode&&selectedCount>0&&(
        <div style={{background:"#FFEBEE",border:"1px solid #FFCDD2",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:600,color:"var(--danger)",flex:1}}>已选 {selectedCount} 条记录</span>
          <button className="btn btn-xs" style={{background:"var(--danger)",color:"#fff",fontWeight:700}}
            onClick={()=>setBulkDelConfirm(true)}>🗑 批量删除</button>
        </div>
      )}

      {submissions.length===0?<Empty label={t.noData}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {tasksWithSubs.map(task=>{
            const isExp=expandedTasks[task.id]!==false; // default open
            return(
              <div key={task.id} style={{background:"var(--surface)",borderRadius:12,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
                {/* Task group header */}
                <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,background:"var(--surface)",borderBottom:isExp?"1px solid var(--border)":"none",userSelect:"none"}}>
                  {selectMode&&(
                    <input type="checkbox" checked={task.subs.every(s=>selected[s.id])}
                      onChange={()=>selectAllInTask(task.subs)}
                      style={{width:18,height:18,accentColor:"var(--mi-orange)",flexShrink:0}}/>
                  )}
                  <div onClick={()=>toggleTaskExpand(task.id)} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".8"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"var(--mi-orange)",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{locale==="zh"?task.name:task.nameEn}</div>
                      <div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>
                        {task.subs.length} 条提交 · 截止 {fmtDate(task.deadline)}
                      </div>
                    </div>
                    <span className="tag tag-orange">{task.subs.length}</span>
                    <span style={{color:"var(--text3)",fontSize:16,transform:isExp?"rotate(90deg)":"none",transition:"transform .2s",display:"inline-block"}}>›</span>
                  </div>
                </div>

                {/* Submission rows */}
                {isExp&&task.subs.map((s,idx)=>{
                  const claimedPhoto=task.photos.find(p=>p.id===s.claimedPhotoId);
                  const isSel=!!selected[s.id];
                  return(
                    <div key={s.id} style={{padding:"12px 16px",borderBottom:idx<task.subs.length-1?"1px solid var(--border)":"none",background:isSel?"#FFF8E1":"var(--surface2)"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
                        {selectMode&&<input type="checkbox" checked={isSel} onChange={()=>toggleSelect(s.id)}
                          style={{width:16,height:16,accentColor:"var(--mi-orange)",flexShrink:0,marginTop:2}}/>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.email}</div>
                          <div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>{fmtTime(s.submittedAt)}</div>
                        </div>
                        {!selectMode&&<button className="btn btn-danger" style={{minHeight:28,padding:"0 10px",fontSize:11,flexShrink:0}} onClick={()=>setDelConfirm(s.id)}>✕</button>}
                      </div>

                      <div className="info-row">
                        {claimedPhoto&&(
                          <div className="info-chip">
                            <div style={{width:18,height:18,borderRadius:3,overflow:"hidden",flexShrink:0}}>
                              {claimedPhoto.url?<img src={claimedPhoto.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",background:claimedPhoto.gradient}}/>}
                            </div>
                            {claimedPhoto.name}
                          </div>
                        )}
                        {s.workImageUrl?(
                          <div className="info-chip" style={{background:"#E8F5E9",color:"#2E7D32",cursor:"pointer"}} onClick={()=>openLightbox(s,task.subs)}>
                            <img src={s.workImageUrl} alt="" style={{width:18,height:18,borderRadius:3,objectFit:"cover"}}/>
                            {t.btnViewWork}
                          </div>
                        ):<div className="info-chip" style={{color:"var(--text3)",fontStyle:"italic"}}>{t.noWorkImage}</div>}
                        {s.phone&&<div className="info-chip">📱 {s.phone}</div>}
                        {s.orderNo&&<div className="info-chip" style={{background:"#E3F2FD",color:"#1565C0"}}>🧾 {s.orderNo}</div>}
                      </div>
                      {s.note&&<div style={{fontSize:11,color:"var(--text2)",marginTop:6,fontStyle:"italic"}}>{s.note}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bulk delete confirm ── */}
      {bulkDelConfirm&&(
        <div className="overlay overlay-center" onClick={()=>setBulkDelConfirm(false)}>
          <div className="dialog scale-in" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🗑</div>
            <p style={{fontSize:14,textAlign:"center",fontWeight:600,marginBottom:8}}>删除 {selectedCount} 条提交记录？</p>
            <p style={{fontSize:12,color:"var(--text3)",textAlign:"center",marginBottom:20}}>此操作不可恢复</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setBulkDelConfirm(false)} disabled={bulkDeleting}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2,background:"var(--danger)"}} disabled={bulkDeleting}
                onClick={handleBulkDelete}>{bulkDeleting?"删除中…":"🗑 确认删除"}</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Export modal ── */}
      {exportOpen&&(
        <div className="overlay overlay-center" onClick={()=>setExportOpen(false)}>
          <div className="dialog scale-in" style={{maxWidth:480,width:"92%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            {/* Modal header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <div style={{width:36,height:36,background:"var(--mi-orange-light)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📊</div>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>{t.exportTitle}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>每个任务导出为独立的 Sheet</div>
              </div>
            </div>

            {/* ── Select tasks ── */}
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:".04em"}}>{t.exportTasks}</span>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setSelTasks(tasksWithSubs.map(tk=>tk.id))}>{t.exportSelectAll}</button>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setSelTasks([])}>{t.exportClear}</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {tasksWithSubs.map(tk=>{
                  const sel=selTasks.includes(tk.id);
                  return(
                    <label key={tk.id} onClick={()=>toggleSelTask(tk.id)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:`1.5px solid ${sel?"var(--mi-orange)":"var(--border)"}`,background:sel?"var(--mi-orange-light)":"var(--surface2)",cursor:"pointer",transition:"all .15s",userSelect:"none"}}>
                      <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${sel?"var(--mi-orange)":"var(--border)"}`,background:sel?"var(--mi-orange)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {sel&&<span style={{color:"#fff",fontSize:11,fontWeight:800,lineHeight:1}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{locale==="zh"?tk.name:tk.nameEn}</div>
                        <div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>{tk.subs.length} 条提交</div>
                      </div>
                      <span className="tag tag-orange" style={{fontSize:10}}>{tk.subs.length}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Select columns ── */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:".04em"}}>{t.exportCols}</span>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setSelCols(ALL_COLS.map(c=>c.key))}>{t.exportSelectAll}</button>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setSelCols([])}>{t.exportClear}</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {ALL_COLS.map(col=>{
                  const sel=selCols.includes(col.key);
                  return(
                    <label key={col.key} onClick={()=>toggleSelCol(col.key)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,border:`1.5px solid ${sel?"var(--mi-orange)":"var(--border)"}`,background:sel?"var(--mi-orange-light)":"var(--surface2)",cursor:"pointer",transition:"all .15s",userSelect:"none"}}>
                      <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${sel?"var(--mi-orange)":"var(--border)"}`,background:sel?"var(--mi-orange)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {sel&&<span style={{color:"#fff",fontSize:10,fontWeight:800,lineHeight:1}}>✓</span>}
                      </div>
                      <span style={{fontSize:13,fontWeight:500}}>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preview summary */}
            {selTasks.length>0&&selCols.length>0&&(
              <div style={{padding:"10px 14px",background:"var(--bg)",borderRadius:8,marginBottom:16,fontSize:12,color:"var(--text2)",lineHeight:1.6}}>
                📋 将导出 <strong style={{color:"var(--mi-orange)"}}>{selTasks.length}</strong> 个任务的 Sheet，
                每行包含 <strong style={{color:"var(--mi-orange)"}}>{selCols.length}</strong> 列数据
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setExportOpen(false)}>{t.btnCancel}</button>
              <button className="btn btn-primary" style={{flex:2,fontWeight:700}} onClick={handleExport}>
                📥 {t.exportConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {delConfirm!==null&&<ConfirmDialog msg={t.confirmDelete} onConfirm={()=>handleDelete(delConfirm)} onCancel={()=>setDelConfirm(null)} t={t}/>}

      {workLightbox&&lbSub&&(
        <div className="overlay" style={{alignItems:"center",background:"rgba(0,0,0,.88)"}}
          onClick={()=>setWorkLightbox(null)}>
          <div style={{width:"100%",maxWidth:700,display:"flex",flexDirection:"column",maxHeight:"98vh"}}
            onClick={e=>e.stopPropagation()}>

            {/* ── Top bar ── */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",flexShrink:0}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:13,color:"#fff",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {locale==="zh"?lbTask?.name:lbTask?.nameEn}
                </div>
                <div style={{fontSize:11,color:"#888",marginTop:1}}>
                  {workLightbox.idx+1} / {lbTotal}
                </div>
              </div>
              {/* Dot indicator */}
              {lbTotal>1&&(
                <div style={{display:"flex",gap:5,alignItems:"center",marginLeft:12}}>
                  {workLightbox.imgSubs.map((_,i)=>(
                    <div key={i} onClick={()=>setWorkLightbox(prev=>({...prev,idx:i}))}
                      style={{width:i===workLightbox.idx?18:6,height:6,borderRadius:3,background:i===workLightbox.idx?"var(--mi-orange)":"#555",transition:"all .25s",cursor:"pointer"}}/>
                  ))}
                </div>
              )}
              <button onClick={()=>setWorkLightbox(null)}
                style={{marginLeft:14,background:"rgba(255,255,255,.1)",border:"none",color:"#fff",width:34,height:34,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                ✕
              </button>
            </div>

            {/* ── Image + nav arrows ── */}
            <div style={{position:"relative",flex:1,minHeight:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {/* Prev */}
              {workLightbox.idx>0&&(
                <button onClick={lbPrev}
                  style={{position:"absolute",left:8,zIndex:10,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",width:44,height:44,borderRadius:"50%",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",flexShrink:0}}>
                  ‹
                </button>
              )}

              {/* Image */}
              <img key={lbSub.id} src={lbSub.workImageUrl} alt=""
                style={{maxWidth:"100%",maxHeight:"60vh",objectFit:"contain",display:"block",borderRadius:12,animation:"fadeIn .2s ease"}}/>

              {/* Next */}
              {workLightbox.idx<lbTotal-1&&(
                <button onClick={lbNext}
                  style={{position:"absolute",right:8,zIndex:10,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",width:44,height:44,borderRadius:"50%",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",flexShrink:0}}>
                  ›
                </button>
              )}
            </div>

            {/* ── Info panel ── */}
            <div style={{background:"rgba(255,255,255,.06)",borderRadius:"0 0 16px 16px",padding:"16px 20px",flexShrink:0,backdropFilter:"blur(8px)"}}>
              {/* Email + order row */}
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:28,height:28,borderRadius:14,background:"var(--mi-orange)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>✉️</div>
                  <div>
                    <div style={{fontSize:10,color:"#777",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>邮箱</div>
                    <div style={{fontSize:13,color:"#fff",fontWeight:600}}>{lbSub.email}</div>
                  </div>
                </div>
                {lbSub.orderNo&&(
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:28,height:28,borderRadius:14,background:"#1565C0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🧾</div>
                    <div>
                      <div style={{fontSize:10,color:"#777",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>订单编号</div>
                      <div style={{fontSize:13,color:"#fff",fontWeight:600}}>{lbSub.orderNo}</div>
                    </div>
                  </div>
                )}
                {lbSub.phone&&(
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:28,height:28,borderRadius:14,background:"#2E7D32",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>📱</div>
                    <div>
                      <div style={{fontSize:10,color:"#777",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>手机号</div>
                      <div style={{fontSize:13,color:"#fff",fontWeight:600}}>{lbSub.phone}</div>
                    </div>
                  </div>
                )}
              </div>
              {/* File name + time */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                <div style={{fontSize:11,color:"#666"}}>{lbSub.workFileName}</div>
                <div style={{fontSize:11,color:"#555"}}>{fmtTime(lbSub.submittedAt)}</div>
              </div>
              {lbSub.note&&<div style={{fontSize:12,color:"#999",marginTop:6,fontStyle:"italic"}}>备注：{lbSub.note}</div>}
            </div>

            {/* Swipe hint on mobile */}
            {lbTotal>1&&(
              <div style={{textAlign:"center",padding:"8px 0",fontSize:11,color:"#444"}}>
                点击两侧箭头切换 · {lbTotal} 张作品
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
function ConfirmDialog({msg,onConfirm,onCancel,t}){
  return(
    <div className="overlay overlay-center" onClick={onCancel}>
      <div className="dialog scale-in" onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🗑️</div>
        <p style={{fontSize:14,textAlign:"center",fontWeight:600,marginBottom:24,color:"var(--text)"}}>{msg}</p>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-ghost" style={{flex:1}} onClick={onCancel}>{t.btnCancel}</button>
          <button className="btn btn-primary" style={{flex:2,background:"var(--danger)",fontWeight:700}} onClick={onConfirm}>{t.btnDelete}</button>
        </div>
      </div>
    </div>
  );
}
