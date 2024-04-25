export const FormFileAcceptedExt = ["jpg", "jpeg", "png", "gif", "pdf"]


export const ImgFileContentType: Record<string, string> = {
    "jpg": "image/jpg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif"
}

export const DocFileContentType: Record<string, string> = {
    "pdf": "application/pdf"
}

export const FormFileContentType: Record<string, string> = {
    ...ImgFileContentType,
    ...DocFileContentType
}