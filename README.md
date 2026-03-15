# TradingView Screenshot Bot (Windows)

Tự động mở TradingView chart, chuyển khung thời gian (5m, 15m, 1h, 4h, 1D, 1W) và chụp ảnh.

## 1) Yêu cầu

- Windows 10/11
- Node.js 18+ (khuyến nghị 20+)
- Tài khoản TradingView (để xem futures/indicator tuỳ chart)

## 2) Cài đặt

```bash
cd tradingview-screenshot-bot
npm install
npx playwright install --with-deps chromium
```

## 3) Cấu hình `.env`

Copy file mẫu:

```bash
copy .env.example .env
```

Mở `.env` và điền cookie phiên đăng nhập TradingView.

### Cách lấy cookie `sessionid` và `sessionid_sign`

1. Đăng nhập TradingView trên Chrome.
2. Mở DevTools (F12) → tab **Application** → **Cookies** → `https://www.tradingview.com`
3. Tìm 2 cookie sau và copy **Value**:
   - `sessionid`
   - `sessionid_sign`
4. Dán vào `.env`.

> Lưu ý: Đây là cookie nhạy cảm (giống như token đăng nhập). Không chia sẻ công khai.

## 4) Chạy bot

### Chạy lần đầu (có UI) để bạn kiểm tra chart/indicator

```bash
npm run build
npm run shot:headed
```

- Bot sẽ mở chart.
- Nếu indicator chưa đúng như bạn muốn, bạn có thể tự add/điều chỉnh trên UI.
- Sau khi ok, hãy **Save** layout/chart (Ctrl+S trên TradingView) để lần sau ổn định.

### Chạy bình thường (headless)

```bash
npm run build
npm run shot
```

Ảnh lưu trong: `output/<SYMBOL>/<YYYY-MM-DD>/<timeframe>.png`

## 5) Tuỳ biến

- `SYMBOL` mặc định: `BINANCE:ETHUSDT.P` (ETHUSDT perpetual futures trên Binance – thường là ký hiệu .P trên TradingView)
- Danh sách timeframe: sửa trong `src/config.ts`
- Kích thước ảnh: sửa `VIEWPORT_WIDTH/HEIGHT` trong `.env`

## Ghi chú về TradingView UI

TradingView thay đổi UI khá thường xuyên. Script được viết theo hướng “best-effort”:
- Luôn đảm bảo: mở chart đúng symbol + set timeframe + chụp.
- Phần add indicator (Volume/MA) cố gắng tự thao tác; nếu không ổn trên máy bạn, bạn có thể làm thủ công 1 lần rồi Save layout, sau đó bot chỉ chụp.
