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
// const fetch = require('node:fetch');        // fetchは内部モジュールのはずなのに、書いたら怒られる
                                               // 宣言しなくても動くからいっか...
// RFC3986 エンコード処理
const RFC3986_encode = str => {
    // encodeURIComponent()はRFC2396エンコードなので、
    // replaceでRFC3986で追加の分(!*'())をエンコードする
    let ret = encodeURIComponent(str).replace(/[!*'()]/g, (p) => "%" + p.charCodeAt(0).toString(16));
    return ret;
}

// LINE notifyへメッセージ送信する関数  中でawaitするのでasync関数でないといけない
const line_notify = async (message) => {
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
                     // 'Connection'    : 'close',         // これを指定するとfetch()がエラーになる
                        'Authorization' : `Bearer ${access_token}`,
                        'Content-Type'  : 'application/x-www-form-urlencoded',
                },
            body    : postDataStr,
        };
    
    let res;
    try {
        // サーバへの接続
        res = await fetch(url, options);
    } catch(err) {
        // 例外発生(サーバが見つからないなど)
        console.log("#### NG ####");
        console.log(`---- exception : ${err.name}    ${err.message}`);
        return;
    }
    if (res.ok) {
        console.log("#### OK ####");
    } else {
        console.log("#### NG ####");
        console.log(`---- error code : ${res.status}`);
    }
    // ヘッダの表示
    console.log("---- header ----");
    res.headers.forEach((value, key) => { console.log(`    ${key} : ${value}`);});
    // メッセージボディの表示
    console.log("---- body ----");
    const data = await res.text();          // TEXTデータとしてstringに入れる場合はこちら
    // const data = await res.json();       // JSON パースして連想配列に入れる場合はこちら
                                            // streamから読み込むので、両方実行することはできない
                                            // 両方必要ならテキストで取得してからJSONパースするなどする
    console.log(`    type :  ${typeof data}`);
    console.log(`    data : ${data}`);
    console.log("---- ------ ----");

    // console.log("############");
    // console.log(res);
    // console.log("############");
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

