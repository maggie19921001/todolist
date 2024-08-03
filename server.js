console.log("Hello");
const http = require("http");//node.js內建模組
const { v4: uuidv4 } = require('uuid');//外部npm
const errorHandle = require('./errorHandle');//自製模組
const todos =[];
//給伺服器的header
const requestListener = function(req,res){
    const headers ={
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
        'Content-Type': 'application/json'
    }
    //接收對方資料
    let body = "";
    req.on('data',chunk=>{
        body+=chunk;//chunk=TCP封包（檔案大的話會執行多次）
    })

    //設定API不同指令狀態
    console.log(req.method);
    if(req.url=="/todos" && req.method=="GET"){
        res.writeHead(200,headers)
        res.write(JSON.stringify({
            "status": "success",
            "data":todos
        }))
        res.end()
    }else if(req.url=="/todos" && req.method=="POST"){
        req.on('end',()=>{
            try{
                const title =JSON.parse(body).title;//check1:body是否為物件可編譯
                if(title!= undefined){//check2:物件中title是否存在
                    const todo = {
                        "title":title,
                        "id":uuidv4()
                    }
                    todos.push(todo);
                    res.writeHead(200,headers)
                    res.write(JSON.stringify({
                    "status": "success",
                    "data":todos
                    }))
                    res.end()
                }else{
                    errorHandle(res)
                }
            }catch(error){
                errorHandle(res)
            }
        })   
    }else if(req.url=="/todos" && req.method=="DELETE"){
        todos.length = 0;//清空陣列
        res.writeHead(200,headers)
        res.write(JSON.stringify({
            "status": "success",
            "data":todos,
        }))
        res.end()
    }else if(req.url.startsWith("/todos/") && req.method=="DELETE"){
        //查看網址是否包含最後一個/，如有代表後面有ID，為單項刪除請求
        const id = req.url.split('/').pop();
        //將使用者網址用split 以/拆分成陣列，並用pop推出最後一個值
        const index = todos.findIndex(element=> element.id==id);
        //比對網址後方的ID是否與資料中的ID相同
        if(index !== -1){
            todos.splice(index,1);
            res.writeHead(200,headers)
            res.write(JSON.stringify({
            "status": "success",
            "data":todos,
            }))
            res.end()
        }else{
            errorHandle(res)
        }
        
        
    }else if(req.url.startsWith("/todos/") && req.method=="PATCH"){
        req.on('end',()=>{
            try{
                const todo = JSON.parse(body).title;
                const id = req.url.split('/').pop();
                const index = todos.findIndex(element => element.id ==id);
                if(todo !== undefined && index !== -1){
                    todos[index].title=todo;
                    res.writeHead(200,headers);
                    res.write(JSON.stringify({
                    "status": "success",
                    "data":todos,
                    }));
                    res.end();
                }else{
                    errorHandle(res);
                }
            }catch{
                errorHandle(res);
            }
        })
    }else if(req.method=="OPTIONS"){
        res.writeHead(200,headers);
        res.end();//回應preflight的OPTIONS請求，一般會加上驗證訊息
    }else{
        res.writeHead(404,headers)
        res.write(JSON.stringify({
            "status": "false",
            "message":"無此網站路由",
        }))
        res.end()
    }
 
}

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);//讀取當前環境PORT 或本地端