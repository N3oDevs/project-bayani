# API Specs

POST `/predict`

Form-Data: `file` (image)

Response: `{ predictions: Array<{ bbox: number[], score: number, label: string }> }`

