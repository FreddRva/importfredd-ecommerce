package lib

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func UploadFileToS3(file multipart.File, fileHeader *multipart.FileHeader, key string) (string, error) {
	bucket := os.Getenv("AWS_S3_BUCKET")
	region := os.Getenv("AWS_REGION")

	// Log para depuración
	fmt.Println("[S3] AWS_REGION:", region)

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)
	if err != nil {
		return "", fmt.Errorf("error loading AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	// Sube el archivo a S3
	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		Body:        file,
		ContentType: aws.String(fileHeader.Header.Get("Content-Type")),
	})
	if err != nil {
		return "", fmt.Errorf("error uploading to S3: %w", err)
	}

	// URL pública del archivo
	url := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key)

	// Log para depuración
	fmt.Println("[S3] URL generada:", url)

	return url, nil
}
