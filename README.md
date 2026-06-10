# PR Scan & Outreach Tool

Webapp giúp scan các bài PR trên các trang media crypto và thực hiện outreach tới các dự án.

## Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express
- **Deployment:** GitHub -> Railway

## Hướng dẫn cài đặt và chạy Local

1.  **Cài đặt dependencies:**
    ```bash
    npm install
    # Nếu chưa có axios và cheerio ở root, hãy cài thêm:
    # npm install axios cheerio
    cd client
    npm install
    cd ..
    ```

2.  **Chạy ứng dụng (Development mode):**
    - Chạy backend: `npm run dev` (sẽ chạy ở port 3001)
    - Chạy frontend: `cd client && npm run dev` (sẽ chạy ở port 5173, có proxy qua 3001)

3.  **Sử dụng Tool:**
    - Truy cập `http://localhost:5173`.
    - Nhấn nút **"Start New Scan"** để bắt đầu quét các trang media.
    - Đợi hệ thống quét và trích xuất thông tin liên hệ.
    - Dữ liệu sẽ được lưu vào file `server/db.json`.

## Tính năng đã hoàn thiện
- [x] Scraper tự động cho BeInCrypto và AMBCrypto.
- [x] Trích xuất Telegram và Email từ nội dung bài viết.
- [x] Dashboard hiển thị stats thời gian thực.
- [x] Lưu trữ dữ liệu bền vững qua file JSON.
- [x] Giao diện Outreach (template mail/TG).

## Hướng dẫn Deployment lên Railway
...
1.  **Push code lên GitHub:**
    - Tạo một repository mới trên GitHub.
    - Chạy các lệnh sau trong folder dự án:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git remote add origin <your-github-repo-url>
        git push -u origin main
        ```

2.  **Deploy lên Railway:**
    - Truy cập [Railway.app](https://railway.app/).
    - Chọn **New Project** -> **Deploy from GitHub repo**.
    - Chọn repository bạn vừa push.
    - Railway sẽ tự động nhận diện dự án Node.js và deploy.
    - Đảm bảo thiết lập biến môi trường `PORT` (Railway tự làm việc này).
    - Lệnh build trên Railway sẽ tự động chạy `npm install` và `npm start`.

## Cấu trúc dự án
- `server/`: Chứa mã nguồn backend Express API và mock data.
- `client/`: Chứa mã nguồn frontend React.
- `package.json`: Quản lý scripts cho cả hai phần.
