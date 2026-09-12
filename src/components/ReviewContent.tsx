import { reviews } from "@/generated/reviews";

export function ReviewContent({ slug }: { slug: string }) {
  const Review = reviews[slug];
  return Review ? <Review /> : null;
}
