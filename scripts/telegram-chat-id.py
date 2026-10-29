"""Get a NEW bot's chat IDs locally without echoing or saving its token."""
import getpass,json,urllib.request,urllib.error

def main():
    token=getpass.getpass('Token bot mới (không hiện khi nhập): ').strip()
    if not token or ':' not in token:
        print('Token chưa đúng định dạng.');return
    try:
        req=urllib.request.Request('https://api.telegram.org/bot'+token+'/getUpdates',data=b'limit=100&timeout=0',method='POST')
        with urllib.request.urlopen(req,timeout=15) as response:
            result=json.load(response)
        if not result.get('ok'):
            print('Telegram chưa xác nhận. Kiểm tra token và quyền bot.');return
        chats={}
        for item in result.get('result',[]):
            message=item.get('message') or item.get('channel_post') or {}
            chat=message.get('chat') or {}
            if chat.get('id') is not None:
                chats[chat['id']]=chat.get('title') or chat.get('first_name') or chat.get('type') or ''
        if not chats:
            print('Chưa có cuộc trò chuyện. Bấm Start/gửi tin cho bot mới hoặc thêm vào nhóm quản trị rồi chạy lại.')
        for chat_id,title in chats.items():
            print(f'Chat ID: {chat_id} | {title}')
    except urllib.error.HTTPError as error:
        print('Telegram trả mã',error.code,'— kiểm tra token; bot mới này chỉ dùng để gửi thông báo, không cần webhook.')
    except Exception:
        print('Chưa kết nối được Telegram. Kiểm tra mạng và thử lại; token không được in ra hoặc lưu.')

if __name__=='__main__':
    main()
