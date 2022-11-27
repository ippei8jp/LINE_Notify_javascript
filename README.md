# LINE Notify にメッセージ送信するテストプログラム(Javascript版)

## 概要
LINE Notifyについてはこちら→ <https://notify-bot.line.me/ja/>{:target="_blank"} 
tls(socket通信)、https、fetch それぞれのモジュールを使用したテストプログラムを作成しました。
fetch APIを使うものはNode.js V18以降が必要ですが、その他はちょっとくらい古くても大丈夫でしょう。

なんでtlsのようなlowlevelなモジュールを使っているかというと、  
以前組み込みJavascriptのEspruinoでプログラムを書いたことがあって、  
(これには上位プロトコルのモジュールがなかった)  
それをNode.jsで今風(主にclass化)に書き直してみようと思ったのがきっかけです。  

参考：[Espruino on ESP32 で LINE(その1)](https://ippei8jp.hatenablog.jp/entry/2017/07/29/113554){:target="_blank"}  

でもって、どうせならと上位プロトコルのモジュールでも試してみようとhttpsとfetch版も追加しました。
でも、モジュールインストールするのはめんどっちいので、標準モジュールだけで。  

あと、有名なrequestモジュールが非推奨になってるみたいで、それ以外のやり方を探してみたというのもあります。  


## 事前準備
アクセストークンが必要なので、[このへん](https://qiita.com/iitenkida7/items/576a8226ba6584864d95){:target="_blank"}
を参考にアクセストークンを取得してください。  

取得したアクセストークンは``access_token.js``ファイルに以下のように格納してください。  
間違ってgithubにcommitしてしまわないように、別ファイルにして``.gitignore``に書いてあります。  

```
module.exports = '«取得したアクセストークン»';
```

## プログラム
| ファイル名          | 内容                                                 |
|---------------------|------------------------------------------------------|
|access_token.js      | アクセストークン(上記に従って作成してください)       |
|test_tiny_line.js    | tls版 テストプログラム本体                           | 
|　　tiny_line.js     | 　　LINE Notify送信用クラス定義                      |
|test_https.js        | https版 テストプログラム本体                         |
|test_fetch.js        | fetch版 テストプログラム本体                         |

## 実行方法
特にオプション/パラメータはありません。テストプログラムをnode.jsで実行してください。  
(テスト用にちょこっとコマンドラインパラメータ使ってるけど、気にしないでちょ)

> ``test_fetch.js``を実行すると以下のように言われるけど、気にしないでおこう。  
> ```
>  ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time
> (Use `node --trace-warnings ...` to show where the warning was created)
> ```




## 感想
やはり、fetchを使うのが一番分かりやすいかな(async/await使うとプログラム追いやすい)。  
まだ実装されたばかり(?)で仕様変更されるかもしれんけど。  


何かのセンサ入力を送信トリガにすれば、簡単に通知システムが構築できそう。  
でも、送信回数に制限があるので(現状1時間に1000回だったかな?)、やりすぎにはご注意ください。  


