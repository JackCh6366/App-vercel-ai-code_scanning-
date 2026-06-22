import { CodeTemplate } from "./types";

export const TEMPLATES: CodeTemplate[] = [
  {
    name: "React 效能與語法錯誤 ⚠️",
    description: "具有 useEffect 依賴缺失 (無限渲染)、無效屬性 (class 而非 className) 以及舊版 JSX 架構問題的元件。",
    language: "tsx",
    code: `import React, { useState, useEffect } from 'react';

export default function BadReactComponent() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([]);
  
  // 錯誤 1: 無依賴陣列加上直接 setState 會引發「無限死循環渲染」!
  useEffect(() => {
    console.log("正在獲取遠端資料...");
    fetch("https://api.example.com/items")
      .then(res => res.json())
      .then(result => {
        setData(result);
      });
  });

  // 錯誤 2: 使用 class 而非 className
  return (
    <div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
      <div class="flex-shrink-0">
        <h1 style={{color: 'red'}}>我的計數器</h1>
      </div>
      <div>
        <p class="text-gray-500">
          目前計數: {count}
        </p>
        
        {/* 錯誤 3: 隱式 'any' 且直接定義 onClick 函數（容易造成 inline re-render） */}
        <button 
          onClick={function(event){ 
            setCount(count + 1) ;
          }} 
          class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 focus:outline-none"
        >
          按我增加
        </button>
      </div>
    </div>
  );
}`
  },
  {
    name: "TypeScript 混亂與 unsafe any 類型 ❌",
    description: "過度濫用 any 類型，不安全的可選屬性存取，以及缺乏型別防護 (Type Guard) 的程式碼。",
    language: "typescript",
    code: `// 警告: no-explicit-any
function processUserData(user: any) {
  // 錯誤: 未做空值安全機制保護
  const nameLength = user.profile.name.length;
  console.log("User name length is: " + nameLength);
  
  // 警告: == 取代 ===
  if (user.role == "admin") {
    console.log("這是一個管理員用戶！");
  } else {
    console.log("一般使用者。");
  }
}

interface ApiResponse {
  data: any;
  status: string;
}

export function handleServerResponse(response: ApiResponse) {
  // 嚴重錯誤: 變數宣告了卻完全沒有使用 (no-unused-vars)
  const unusedSecretToken = "QAQ_ABC123_SUPERSECRET";

  if(response.status === "success") {
    const data = response.data;
    // 試圖呼叫未知型別的方法
    data.renderWidget();
  }
}`
  },
  {
    name: "Prettier 混亂排版與格式 🪓",
    description: "混合了單引號/雙引號、多餘的無意義空白縮排、缺乏分號、變數格式奇怪、代碼不易閱讀的案例。",
    language: "javascript",
    code: `const   myBadFormattedFunction   =   (a,b)   =>   {
  const greeting = "Hello"
    const singleQuoteStr = '這是我隨手寫的單引號'
  
  
    // 這一行縮排太嚴重了
          const value = a+b;
  
  const obj = {
    name: "張三",
    age:28 ,
      address:"台北市南京東路"   ,
     hobbies: ["看書","寫程式",]
  }

      console.log(greeting   ,   singleQuoteStr   ,   value)
  return    obj
}`
  }
];
