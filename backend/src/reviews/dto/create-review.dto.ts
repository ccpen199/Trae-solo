export class CreateReviewDto {
  orderId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment: string;
  tags?: string[];
  images?: string[];
}
