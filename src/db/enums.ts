export const PaymentGateway = {
    CASHFREE: "CASHFREE",
    PAYPAL: "PAYPAL",
    RAZORPAY: "RAZORPAY"
} as const;
export type PaymentGateway = (typeof PaymentGateway)[keyof typeof PaymentGateway];
export const PaymentStatus = {
    CREATED: "CREATED",
    FAILED: "FAILED",
    SUCCESSFUL: "SUCCESSFUL"
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PurchaseItemTypes = {
    COURSE: "COURSE",
    BOOK: "BOOK",
    SUBSCRIPTION: "SUBSCRIPTION"
} as const;
export type PurchaseItemTypes = (typeof PurchaseItemTypes)[keyof typeof PurchaseItemTypes];
export const QueryStatus = {
    PENDING: "PENDING",
    RESOLVED: "RESOLVED"
} as const;
export type QueryStatus = (typeof QueryStatus)[keyof typeof QueryStatus];
export const PaymentCurrency = {
    INR: "INR",
    USD: "USD"
} as const;
export type PaymentCurrency = (typeof PaymentCurrency)[keyof typeof PaymentCurrency];
export const AuthProvider = {
    GOOGLE: "GOOGLE",
    APPLE: "APPLE",
    CREDENTIALS: "CREDENTIALS"
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export const UserGender = {
    male: "male",
    female: "female",
    others: "others"
} as const;
export type UserGender = (typeof UserGender)[keyof typeof UserGender];
export const AdminRole = {
    ADMIN: "ADMIN",
    SUPERADMIN: "SUPERADMIN"
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
export const BannerType = {
    GIF: "GIF",
    IMAGE: "IMAGE",
    VIDEO: "VIDEO"
} as const;
export type BannerType = (typeof BannerType)[keyof typeof BannerType];
export const BundleEntityType = {
    COURSE: "COURSE",
    BOOK: "BOOK"
} as const;
export type BundleEntityType = (typeof BundleEntityType)[keyof typeof BundleEntityType];
export const CourseLMSSubTopicTypeEnum = {
    QUIZ: "QUIZ",
    LECTURE: "LECTURE"
} as const;
export type CourseLMSSubTopicTypeEnum = (typeof CourseLMSSubTopicTypeEnum)[keyof typeof CourseLMSSubTopicTypeEnum];
export const CourseLanguages = {
    English: "English",
    Hindi: "Hindi"
} as const;
export type CourseLanguages = (typeof CourseLanguages)[keyof typeof CourseLanguages];
export const PlanStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
} as const;
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];
export const PlanType = {
    PERSONAL: "PERSONAL",
    TEAM: "TEAM",
    ENTERPRISE: "ENTERPRISE"
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];
export const PublishStatus = {
    PUBLISHED: "PUBLISHED",
    NOT_PUBLISHED: "NOT_PUBLISHED"
} as const;
export type PublishStatus = (typeof PublishStatus)[keyof typeof PublishStatus];
export const PurchaseMode = {
    FREE: "FREE",
    PAID: "PAID"
} as const;
export type PurchaseMode = (typeof PurchaseMode)[keyof typeof PurchaseMode];
export const ReportStatus = {
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED"
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
export const ReportType = {
    REVIEW: "REVIEW",
    QANDA: "QANDA",
    REELS_COMMENT: "REELS_COMMENT",
    QANDAREPLY: "QANDAREPLY"
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];
export const VoteType = {
    UPVOTE: "UPVOTE",
    DOWNVOTE: "DOWNVOTE"
} as const;
export type VoteType = (typeof VoteType)[keyof typeof VoteType];
export const BannerSection = {
    HOME: "HOME",
    COURSE_PURCHASE: "COURSE_PURCHASE",
    POPULAR_COURSES: "POPULAR_COURSES"
} as const;
export type BannerSection = (typeof BannerSection)[keyof typeof BannerSection];
export const RoadmapStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
} as const;
export type RoadmapStatus = (typeof RoadmapStatus)[keyof typeof RoadmapStatus];
export const TransactionType = {
    COMMISSION: "COMMISSION",
    WITHDRAWAL: "WITHDRAWAL"
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
export const TransactionStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED"
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];
export const WithdrawalStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    COMPLETED: "COMPLETED"
} as const;
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];
export const PaymentCountry = {
    IN: "IN",
    US: "US"
} as const;
export type PaymentCountry = (typeof PaymentCountry)[keyof typeof PaymentCountry];
export const PaymentType = {
    BANK_TRANSFER: "BANK_TRANSFER",
    UPI: "UPI",
    PAYPAL: "PAYPAL",
    PAYONEER: "PAYONEER"
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
export const QuizPassingStatus = {
    PASSED: "PASSED",
    FAILED: "FAILED"
} as const;
export type QuizPassingStatus = (typeof QuizPassingStatus)[keyof typeof QuizPassingStatus];
export const ReelProcessingStatus = {
    PROCESSED: "PROCESSED",
    PROCESSING: "PROCESSING",
    FAILED: "FAILED"
} as const;
export type ReelProcessingStatus = (typeof ReelProcessingStatus)[keyof typeof ReelProcessingStatus];
