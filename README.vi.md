# Hướng dẫn nhanh (VI)

## Mục tiêu
- Mở chart TradingView cho **ETHUSDT perpetual futures**
- Bật **Volume** + **MA20/MA50**
- Chụp ảnh khung: **5m, 15m, 1h, 4h, 1D, 1W**

## Cookie cần copy
Bạn sẽ cần **2 cookie** (không phải chỉ 1 “sessionId”):
- `sessionid`
- `sessionid_sign`

Cách lấy: Chrome → F12 → Application → Cookies → `https://www.tradingview.com`

## Chạy
```bash
cd tradingview-screenshot-bot
npm install
copy .env.example .env
# điền TV_SESSIONID và TV_SESSIONID_SIGN
npm run build
npm run shot:headed
```

Nếu indicator chưa đúng:
1) Set `MANUAL_SETUP=true` trong `.env`
2) Chạy `npm run shot:headed`
3) Tự add Volume + Moving Average (2 cái) và chỉnh length = 20 và 50
4) Save layout/chart (Ctrl+S)
5) Set `MANUAL_SETUP=false` lại và chạy `npm run shot`

Ảnh nằm trong thư mục `output/`.
