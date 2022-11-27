// モジュール読み込み
const tls          = require('tls');
const EventEmitter = require('events').EventEmitter;

// RFC3986 エンコード処理
const RFC3986_encode = str => {
    // encodeURIComponent()はRFC2396エンコードなので、
    // replaceでRFC3986で追加の分(!*'())をエンコードする
    let ret = encodeURIComponent(str).replace(/[!*'()]/g, (p) => "%" + p.charCodeAt(0).toString(16));
    return ret;
}

// ######## tiny_line class ################################
class tiny_line extends EventEmitter {        // EventEmitterを使用するのでEventEmitterを継承する
    // ######## コンストラクタ ################################
    constructor(access_token, callbacks, _DEBUG_ = false, testmode) {
        super();                            // 親クラスのコンストラクタ
        
        // パラメータ設定
        if (testmode == 'addr_error') {
            this.host = {host: 'notify-api.line.me2', port: 443, endpoint:'/api/notify'};
        } else if (testmode == 'path_error') {
            this.host = {host: 'notify-api.line.me', port: 443, endpoint:'/api/notify2'};
        } else {
            this.host = {host: 'notify-api.line.me', port: 443, endpoint:'/api/notify'};
        }
        this.access_token    = access_token;
        this._DEBUG_         = _DEBUG_;
        
        // コールバッグの登録
        if (callbacks) {
            for (const key in callbacks) {
                this.on(key, callbacks[key]);
            }
        }
    }
    
    // ######## debug print ################################
    debug_print(str) {
        if (this._DEBUG_) {
            // デバッグモードなら表示する
            console.log(str);
        }
    }
    
    // ######## make request message ################################
    makeRequestMessage(message) {
        // メッセージボディの生成
        const encoded_message = RFC3986_encode(message);        // RF3986エンコード
        const postDataStr = `message=${encoded_message}`;       // 送信形式に整形
        
        // リクエストの生成
        const request = `POST ${this.host.endpoint} HTTP/1.1\n`;
        
        // メッセージヘッダの生成
        const snd_header  =   `Host: ${this.host.host}\n`
                            + 'User-Agent: nanchatte line Bot v0.1\n'
                            + 'Accept: */*\n'
                            + 'Connection: close\n'         // これがないとレスポンス受信後も接続状態が保持されてしまう
                                                            // のでendイベントが来ない
                            + `Authorization: Bearer ${this.access_token}\n`
                            + 'Content-Type: application/x-www-form-urlencoded\n'
                            + `Content-Length: ${postDataStr.length.toString()}\n`;
        // 送信文字列の生成(ヘッダとメッセージボディの間に空行1個をはさむ)
        const ret = `${request}${snd_header}\n${postDataStr}\n`;
        
        return ret;
    }
    
    // ######## Send message ################################
    sendmessage(msg) {
        // 分割受信の保存用
        const recv_data = [];
        
        // 接続
        const client = tls.connect(this.host, () => {
            // 接続時のcallback
            this.emit('connect');               // 上位処理へイベント通知
            client.write(msg);                  // データ送信
        });
        
        // データ受信時のイベントハンドラを登録
        client.on('data', chunk => {
            recv_data.push(chunk);          // 受信データをまとめてendイベントでまとめて処理
        });
        
        // 接続断時のイベントハンドラを登録
        client.on('end', () => {
            const recv_total = Buffer.concat(recv_data);  // 受信データを合体
            console.log(`recv_total: ~~~~\n${recv_total}  ~~~~`);
            const rcv_header = recv_total.toString().trim();    // 文字列に変換して前後の空白/改行削除
            if (rcv_header.startsWith('HTTP/')) {               // レスポンスヘッダは"HTTP/"で始まるのでチェック
                const line = rcv_header.split(/\n/)[0];         // 最初の1行取り出し
                const tmp_str = line.split(/\s+/);              // レスポンスを空白で区切る
                const err_code = parseInt(tmp_str[1]);          // エラーコード部を数値化 
                const msg_json = rcv_header.match(/{.*}/);      // メッセージボディ部(｛から｝の間)を取り出し
                                                                // 本来なら空行までがヘッダ、
                                                                // 残りデータ数→データの繰り返しを解析すべきだが、
                                                                // 簡易的に{ から } を読み出すことで対応
                this.emit('response', err_code, msg_json, rcv_header);   // 上位処理へイベント通知
            } else {
                this.debug_print('**** unknown data ****');
            }
            this.emit('end');               // 上位処理へイベント通知
        });
        
        // 接続エラー時のイベントハンドラを登録
        client.on('error', err => {
            if (this.listenerCount('error') > 0 ) { // 上位処理でイベントハンドラ登録されているか?
                this.emit('error', err);        // 上位処理へイベント通知
            } else {
                // イベント登録されていなければここで表示
                // errorイベントはちゃんと処理しないと例外が発生するので
                this.debug_print(`**** ERROR ***    ${err}`);
            }
        });
    }
    
    // ######## notify API ################################
    notify(msg) {
        // パラメータチェック
        if (!msg) {
            throw new Error('message is required.'); 
        }
        
        // 送信データの作成
        const reqMessage = this.makeRequestMessage(msg);
        
        // 送信データの確認
        this.debug_print('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
        this.debug_print(reqMessage);
        this.debug_print('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
        
        // 送信データの送信
        this.sendmessage(reqMessage);
    }
    
}   // end of class

module.exports = tiny_line;

