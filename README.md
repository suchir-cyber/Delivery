
# POD

## Overview
This web-based Proof of Delivery (POD) application empowers delivery agents to efficiently document shipments. It enables quick
  capture and upload of photos or videos, ensuring seamless record-keeping. Designed for simplicity, the app streamlines the
  delivery confirmation process.

## Key Features

The key features of this project include:

   * AWB Number Input: Agents can enter the Air Waybill (AWB) number for the shipment.
   * Media Capture: Agents can capture photos or record videos as proof of delivery.
   * File Upload: Agents can also upload existing photos or videos from their device.
   * File Size Restriction: The application restricts photo uploads to 3MB and video uploads to 10MB.
   * Cloudinary Integration: The application uploads the captured media to Cloudinary for storage and easy access.

## Tech Stack 
   * Frontend: React, TypeScript, Vite, Tailwind CSS
   * Cloud Storage: Cloudinary  

## Demo Images
 <img width="1366" height="881" alt="Image" src="https://github.com/user-attachments/assets/d2a6b53c-a373-4c88-8b95-fc1878222613" />

 <img width="1012" height="542" alt="Image" src="https://github.com/user-attachments/assets/97458201-954b-40b2-9c11-b1cbe5ed1268" />

 <img width="929" height="582" alt="Image" src="https://github.com/user-attachments/assets/1d95e975-850f-4c42-b18f-2196c27c1284" />

 <img width="1055" height="765" alt="Image" src="https://github.com/user-attachments/assets/fe6ef91e-d1ec-49d7-bf2c-8bb40b17e274" />

## Demo video

https://github.com/user-attachments/assets/660e8d91-3cce-4766-b552-036fe597755c

## Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/your-repository.git](https://github.com/your-username/your-repository.git)
    ```

2.  Navigate to the project directory:
    ```bash
    cd Delivery/POD
    ```
    *(Note: If your repository name is not `Delivery`, you might need to `cd your-repository-name/Delivery/POD`)*

3.  Install the dependencies:
    ```bash
    npm install
    ```

4.  Create a `.env` file in the `Delivery/POD` directory and add the following variables:
    ```bash
    VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
    VITE_CLOUDINARY_FOLDER=your_cloudinary_folder
    ```

5.  Start the development server:
    ```bash
    npm run dev
    ```

 Access the application at http://127.0.0.1:8000/.   
## Usage

1.  Enter the AWB number for the shipment.
2.  Select the media type (photo or video).
3.  Capture or upload the media.
4.  Submit the media to upload it to Cloudinary.
