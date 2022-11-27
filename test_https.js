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
const https = require('node:https');        // 最近は内部モジュールには「node:」を付けとくのが良いらしい

// RFC3986 エンコード処理
const RFC3986_encode = str => {
    // encodeURIComponent()はRFC2396エンコードなので、
    // replaceでRFC3986で追加の分(!*'())をエンコードする
    let ret = encodeURIComponent(str).replace(/[!*'()]/g, (p) => "%" + p.charCodeAt(0).toString(16));
    return ret;
}

// LINE notifyへメッセージ送信する関数
const line_notify = message => {
    // 送信メッセージ
    const encoded_message = RFC3986_encode(message);        // RF3986エンコード
    const postDataStr = `message=${encoded_message}`;       // 送信形式に整形
    
    // URL 
    let url;
    if (testmode == 'addr_error') {
        url = 'https://notify-api.line.me2/api/notify';     // エラーになるマシン名
    } else if (testmode == 'path_error') {
        url = 'https://notify-api.line.me/api/notify2';     // エラーになるpath
    } else {
        url = 'https://notify-api.line.me/api/notify';
    }
    // サーバ接続パラメータ
    const options = {
            method  : 'POST',
            headers : {
                        'User-Agent'    : 'nanchatte line Bot v0.1',
                        'Accept'        : '*/*',
                        'Connection'    : 'close',          // これがないとレスポンス受信後も接続状態が保持されてしまう
                                                            // なくても大丈夫だと思うけど念のため
                        'Authorization' : `Bearer ${access_token}`,
                        'Content-Type'  : 'application/x-www-form-urlencoded',
                },
        };
    
    // サーバへの接続リクエストの作成
    const req = https.request(url, options, (res) => {
        //コールバックで色々な処理(レスポンス受信イベントハンドラでやっても良さそう)
        // res は http.IncomingMessage 型
        
        // データ受信イベントハンドラを登録
        res.on('data', (chunk) => {
            res.req.emit('data', chunk);        // 上位へイベント転送
        });
    });
    
    // 送信ヘッダ確認したいときはこちら
    // console.log(req.getHeaders());
    
    // 大域記憶用変数
    let recv_data = '';     // 受信文字列
    let statusCode;         // エラーコード
    let headers;            // ヘッダ
    let error_flag = false; // エラーフラグ
    
    // エラーイベントハンドラ
    req.on('error', (e) => {
        console.log('#### ERROR');
        console.log('---- error message; ' + e.message);
        error_flag = true;
    });
    
    // レスポンス受信イベントハンドラ
    req.on('response', (res) => {
        console.log('#### RESPONSE');
        // res は http.IncomingMessage 型
        // console.dir(res);
        // console.log('---- statusCode: ', res.statusCode);
        // console.log('---- headers:    ',    res.headers);
        
        statusCode = res.statusCode;        // 上位スコープの変数に保存
        headers = res.headers;              // 上位スコープの変数に保存
    });
    
    // メッセージボディ受信イベントハンドラ
    // このイベントはデフォルトで存在しないが、
    // request()のコールバックでデータ受信時にこのイベントにフォワードするようにしてある
    req.on('data', (chunk) => {
        console.log('#### DATA: ' + chunk);
        // chunk は バイト列
        recv_data = recv_data + chunk.toString();       // データ断片を文字列化して結合しておく
    });
    
    // 切断イベントハンドラ
    req.on('close', () => {
        console.log('#### CLOSE');
        if (!error_flag) {      // エラー発生時はデータがないのでスキップ
            if (statusCode == 200) {            // 200～299は正常終了だけど200だけチェックでいっか。
                console.log(`%%%% RESPONSE OK!!! %%%%`);
            } else {
                console.log(`%%%% RESPONSE ERROR!!! : ${statusCode} %%%%`);
            }
            console.log('---- header: ');
            console.dir(headers);                       // オブジェクトの中身をダンプしたいときは
            console.log("#### message body ####");
            console.log(recv_data);
            console.log("############");
        }
    });
    
    // 送信
    req.write(postDataStr);
    
    // 切断
    req.end();
}


// CTRL-Cが押されたときの処理
process.on('SIGINT', () => {
    console.log('Got CTRL-C.');
    console.log('terminated.');
    process.exit(0);
});

// 送信
const message = new Date();       // 現在時刻を送ってみる
line_notify(message);

