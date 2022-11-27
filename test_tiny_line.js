// テストモード指定
var testmode = process.argv[2]

// アクセストークンの読み込み
let access_token;
if (testmode == 'token_error') {
    access_token = 'hogehoge';          // エラーになるアクセストークン
} else {
    access_token = require('./access_token');   // ファイルからアクセストークン読み込み
}

// モジュール読み込み
const tiny_line   = require("./tiny_line");


// 接続イベントハンドラ
const connect_callback = () => {
    console.log("%%%% CONNECTED %%%%");
};

// レスポンスイベントハンドラ
const response_callback = (code, msg, data) => {
    if (code == 200) {      // 200～299は正常終了だけど200だけチェックでいっか。
        // 成功
        console.log(`%%%% RESPONSE : ${code} : ${msg} %%%%`);
    } else {
        // エラー
        console.log(`%%%% RESPONSE ERROR!!! : ${code} : ${msg} %%%%`);
        console.log("#### RESPONSE ####");
        console.log(data);
        console.log("############");
    }
};

// 切断イベントハンドラ
const end_callback = () => {
    console.log("%%%% END %%%%");
};

// エラーイベントハンドラ
const error_callback = err => {
    console.log(`%%%% ERROR %%%%    ${err}`);
};

// CTRL-Cが押されたときの処理
process.on('SIGINT', () => {
    console.log('Got CTRL-C.');
    console.log('terminated.');
    process.exit(0);
});


// 初期化
const tl = new tiny_line(access_token, 
                    {   // コールバック関数群
                        "connect"  : connect_callback, 
                        "response" : response_callback,
                        "end"      : end_callback,
                        "error"    : error_callback,
                    }, 
                    true, testmode);     // DEBUG表示＆テストモード

// メイン処理
const message = new Date();       // 現在時刻を送ってみる
tl.notify(message);

