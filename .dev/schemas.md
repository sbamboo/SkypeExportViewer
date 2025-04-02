Great just that we want to add parsing of some of the message data, here are some schemas that i have found inside the message content:

`%skype-user-id%` are ex "live:<email>"
`%skype-partlist-event-type%` are example `ended` for call-ended and `started` for call-started, `missed` for missed-calls

```XML
<partlist type="%skype-partlist-event-type%" alt="">
    <part identity="%skype-user-id%">
        <name>%skype-user-id%</name>
        <duration>%int%</duration>
    </part>
    <part identity="%skype-user-id%">
        <name>%skype-user-id%</name>
        <duration>%int%</duration>
    </part>
    <part identity="%skype-user-id%">
        <name>%skype-user-id%</name>
        <duration>%int%</duration>
    </part>
</partlist>
```

`<URIObject` have a property `type` which can be `Picture.X`, `Audio.X`/`Audio.X/Message.X` (X is a number often 1)
```XML
<URIObject
    uri="https://api.asm.skype.com/v1/objects/%doc-id%"
    url_thumbnail="https://api.asm.skype.com/v1/objects/%doc-id%/views/imgt1_anim"
    type="Picture.1"
    doc_id="%doc-id%"
    width="600"
    height="1350"
>
    %html-content%

    <OriginalName v="%filename%"></OriginalName>
    <FileSize v="%int%"></FileSize>
    <meta type="photo" originalName="%filename%"></meta>
</URIObject>
``` which turns into
```HTML
<div class="message-uriobject-picture.1" data-uriobject-doc-id="%doc-id%">
    <div class="message-uriobject-thumbnail">
        <img src="%url_thumbnail%" alt="URIObject Thumbnail">
    </div>
    <div class="message-uriobject-overlay-wrapper">
        <p class="message-uriobject-overlay-file">
            <span class="message-uriobject-overlay-filename">%filename%</span> <span class="message-uriobject-overlay-size">(%formatted-size%)</span>
        </p>
        <p class="message-uriobject-overlay-text">
            %html-content%
        </p>
    </div>
</div>
```
and 
```XML
<URIObject
    type="Audio.1/Message.1"
    url_thumbnail="https://api.asm.skype.com/v1/objects/%doc-id%/views/thumbnail"
    uri="https://api.asm.skype.com/v1/objects/%doc-id%"
>
    <Title>%title%</Title>
    <a href="https://login.skype.com/login/sso?go=webclient.xmm&amp;am=%doc-id%">Play</a>
    <OriginalName v="%filename%" />
</URIObject>
``` which turns into
```HTML
<div class="message-uriobject-picture.1" data-uriobject-doc-id="%doc-id%">
    <p class="message-uriobject-title">%title%</p>
    <p class="message-uriobject-file">
        ...audio-player-and-filename...
    </p>
</div>
```

```XML
<c_i id="%uuid%" style="0"></c_i>
```

```XML
<addmember>
    <eventtime>%epoch%</eventtime>
    <initiator>%skype-user-id%</initiator>
    <target>%skype-user-id%</target>
    ...optionally-more-targets...
</addmember>
```

```XML
<historydisclosedupdate>
    <eventtime>%epoch%</eventtime>
    <initiator>%skype-user-id%</initiator>
    <value>%bool%</value>
</historydisclosedupdate>
```

```XML
<URIObject
    type="SWIFT.1"
    url_thumbnail="https://urlp.asm.skype.com/v1/url/content?url=https://neu1-urlp.secure.skypeassets.com/static/card-128x128.png">Om du vill visa det här kortet går du till: <a href="https://go.skype.com/cards.unsupported">https://go.skype.com/cards.unsupported</a>
    <Title></Title>
    <Swift b64="%base64%"/>
</URIObject>
```

In the above the base 64 resolves to a card, example could be: (this is for a gif shown in a `flex-card`)
```JSON
{
    "type": "message/card",
    "attachments": [{
        "contentType": "application/vnd.microsoft.card.flex",
        "content": {
            "shareable": true,
            "subtitle": "%text%",
            "images": [{
                "alt": "%image-alt-text%",
                "url": "%gif-url%",
                "tap": {
                    "type": "showImage"
                },
                "type": "image/gif",
                "stillUrl": "%thumbnail-url%",
                "frames": 0
            }],
            "aspect": "498:280",
            "dimensions": {
                "width": 498,
                "height": 280
            }
        }
    }]
}
```

Inline in messages i have also found markdown formatting like `~text~` aswell as elements like `<a href="%url%">%text%</a>` and special textmoji-to-emoji declarations like `<ss type="smile">:)</ss>` and `<ss type="hi">(wave)</ss>`. Theese seam to be linking a text string to a skype inline gif.

There is also messages like
```
(penguinkiss)  <b>Get ready for a livelier chat experience!</b> (penguinkiss) 

(sparkles) <b>New message reply improvements!</b>

(mediumwhitesquare) <b>Clear and refined:</b> easily identify replies with the new vertical line indicator and the subtle shadow effects. Say goodbye to confusion!
(mediumwhitesquare) <b>Synced colors:</b> the replies now adapt to your selected color scheme, keeping your chats just how you want them. (womanartist) 

(sparkles) Wait, there is more! Introducing - <b>smart reply length!</b>
(mediumwhitesquare) <b>Clean messages:</b> long replies are shortened to give you optimal length to view and respond to your friends. You can also get to the whole message once you tap on it. (pointupindex) 
(mediumwhitesquare) <b>Forwarding with full context:</b> the entire message is included when being forwarded, ensuring clarity and consistency even if you don't have access to the message yourself. (1f440_eyes) 

(partypopper) <b>Try it now in any chat, on Skype!</b> (partypopper)
```
Where we see more skype inline stuff like `(1f440_eyes)` or `(partypopper)` aswell as more HTML tags.


There are also bot messages like:
```json
[{
    "clientVersion": "8.60,",
    "userTagging": {
        "durationInSeconds": 604800
    },
    "contentType": "application/vnd.microsoft.card.popup",
    "cardType": 1,
    "quietCard": true,
    "iconUrl": "https://secure.skypeassets.com/content/dam/engagement/meetnowpromo/ee3a55be-9f4f-4043-8211-1f753d460445_icon-meetnow.jpg",
    "campaignGuid": "meetnow-control",
    "language": "sv",
    "platformList": [1, 2, 3, 4, 5, 1445, 1418],
    "validUntilTimestamp": "2020-07-03T23:36:12.0087172Z",
    "persistencyMode": "none",
    "content": {
        "title": "Möten med 1 klick",
        "text": "Din familj, dina vänner och dina kollegor behöver inte registrera sig eller ladda ned Skype för att delta i mötet! \n\nDu behöver bara dela länken så kan de ansluta som gäster.",
        "media": {
            "url": "https://secure.skypeassets.com/content/dam/engagement/meetnowpromo/65940606-619c-487b-806f-717832542416_meetnow-engagement.gif",
            "mediaType": "image",
            "width": 0
        },
        "buttons": [{
            "actionUri": "skype:?action=meetnow",
            "title": "Prova det",
            "actionTarget": "inappbrowser"
        }]
    },
    "telemetry": {
        "campaignId": "meetnow",
        "variantId": "control-meetnow",
        "iteration": "1"
    },
    "experimentName": "meetnow"
}]
``` 



As well as call recordings like
```XML
<URIObject type="Video.2/CallRecording.1"
    url_thumbnail="https://api.asm.skype.com/v1/objects/%doc-id%/views/thumbnail"
    uri="https://api.asm.skype.com/v1/objects/%doc-id%" version="1.0">
    <RecordingStatus status="Success" code="200">
        <amsErrorResult />
    </RecordingStatus>
    <SessionEndReason value="CallEnded" />
    <ChunkEndReason value="SessionEnded" />
    <Title>Video</Title>
    <a href="https://login.skype.com/login/sso?go=webclient.xmm&am=%doc-id%">Play</a>
    <OriginalName v="Video.mp4" />
    <MeetingOrganizerId value="" />
    <RecordingInitiatorId value="8:live:tuvamatildaelvira" />
    <Identifiers>
        <Id type="callId" value="6c8259ec-41c7-4be5-9c26-79aa45cc1f7f" />
        <Id type="callLegId" value="bfe928c8-0f1b-43e3-a1f7-452a0593eb77" />
        <Id type="chunkIndex" value="0" />
        <Id type="AMSDocumentID" value="%doc-id%" />
        <Id type="StreamVideoId" value="" />
    </Identifiers>
    <RecordingContent timestamp="2020-09-06T08:40:51.1096934Z" duration="0:00:24.28">
        <item type="video" uri="https://api.asm.skype.com/v1/objects/%doc-id%" />
        <item type="amsVideo" uri="https://api.asm.skype.com/v1/objects/%doc-id%" />
        <item type="rosterevents"
            uri="https://api.asm.skype.com/v1/objects/%doc-id%/views/rosterevents" />
    </RecordingContent>
</URIObject>
```

Shared files
```XML
<URIObject uri="https://api.asm.skype.com/v1/objects/%doc-id%"
    url_thumbnail="https://api.asm.skype.com/v1/objects/%doc-id%/views/original"
    type="File.1" doc_id="%doc-id%">Om du vill visa den här filen går du till: <a
        href="https://login.skype.com/login/sso?go=webclient.xmm&docid=%doc-id%">https://login.skype.com/login/sso?go=webclient.xmm&docid=%doc-id%</a>
    <OriginalName v="%file-name%"></OriginalName>
    <FileSize v="%int%"></FileSize>
</URIObject>
```