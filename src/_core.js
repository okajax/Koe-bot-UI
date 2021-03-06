var cookies = require('browser-cookies');

var koeUIcore = {

    // UIのタイプの如何に関わらず、共通する機能をここに格納する。

    // このファイルは、browserifyによって、コンパイルをすること。
    // browserifyのコマンドはpackage.jsonに保存してあるため、ターミナルにて npm run build を実行すればよい。
    // コンパイル後は、koeUIcore.js というファイルが生成される。
    // HTMLでは、そのファイルを読み込むこと。

    // ***********************************************************
    // 変数
    // ***********************************************************
    convID: null, // カンバセーションID: DirectLineAPIが、会話を記録するためのID。30分で無効になる
    watermark: null, // ウォーターマーク: この指定をすると、新しい発言だけ取得できる
    msgObj: {}, // メッセージを格納するオブジェクト
    from: null, // ウォーターフォールの会話を正しく動作させるためには、送信するmessageにfromを指定する

    // ***********************************************************
    // カンバセーションIDの判定・作成する
    // ***********************************************************

    init: function () {

        var that = this; // thatはRiotのカスタムタグを指す
        var cookie_ConvID = cookies.get('convID');

        // クッキーにカンバセーションIDがすでにあるか調べる
        if (cookie_ConvID == undefined) {

            // はーい。ない人はこちらへどうぞ〜

            // オプションを指定
            var myInit = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Botconnector ' + this.opts.token
                },
                contentType: 'application/json'
            };
            // リクエストを指定
            var myRequest = new Request('https://directline.botframework.com/api/conversations', myInit);

            // fetch開始だぽっぽ
            fetch(myRequest)
                .then(function (data) {
                    return data.json() // 紛らわしいからJSONにするぽっぽ
                })
                .then(function (response) {

                    // 30分が期限のクッキーを発行、カンバセーションIDを記憶しておく
                    var date = new Date();
                    date.setTime(date.getTime() + (30 * 60 * 1000));
                    cookies.set("convID", response.conversationId, {
                        expires: date
                    });

                    // カンバセーションIDをriotにわたして、update
                    that.convID = response.conversationId;
                    that.from = 'user_'+that.convID; // from用の文字列も作成
                    that.update();
                });

        } else {

            // え、あるの？ある？　あるんだ...
            // じゃあ既存のものをriotにわたして、update
            that.convID = cookie_ConvID;
            that.from = 'user_'+that.convID; // from用の文字列も作成
            that.update();

        }
    },
    getMessage: function (convID, watermark, callbackAction) {

        console.log('KoeUIcore.js: getMessage');

        if (convID == undefined) {
            console.log('KoeUIcore.js: カンバセーションIDがありません');
            return false;
        }

        var that = this; // thatはRiotのカスタムタグを指す
        var get_url;

        //ウォーターマーク指定があるか調べる
        if (watermark) {
            // 指定があれば、ウォーターマーク付きのURLでGETする。
            get_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages?watermark=' + watermark;
        } else {
            // なければそのまま。ウォーターマークがなければ、全てのメッセージを取得する。
            get_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages';
        }

        // オプションを指定
        var myInit = {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Botconnector ' + this.opts.token
            },
            contentType: 'application/json'
        };
        // リクエストを指定
        var myRequest = new Request(get_url, myInit);

        // fetch開始
        fetch(myRequest)
            .then(function (data) {
                return data.json() // JSONにする
            })
            .then(function (response) {

                // すでに格納しているwatermarkを更新
                that.watermark = response.watermark;

                // 取得した会話を格納
                that.msgObj = response;

                // Viewをアップデート
                that.update();

                if(callbackAction){
                    callbackAction();
                }

            });
    },
    sendMessage: function (convID, text, from) {

        console.log(text);
        console.log('KoeUIcore.js: sendMessage');

        var send_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages';

        // オプションを指定
        var myInit = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Botconnector ' + this.opts.token
            },
            body: JSON.stringify({
                'text': text,
                'from': from
            })
        };
        // リクエストを指定
        var myRequest = new Request(send_url, myInit);

        // fetch開始だぽっぽ
        fetch(myRequest);

    }

};

module.exports = koeUIcore;
