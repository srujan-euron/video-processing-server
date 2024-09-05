import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { PaymentGateway, PaymentStatus, PurchaseItemTypes, QueryStatus, PaymentCurrency, AuthProvider, UserGender, AdminRole, BannerType, BundleEntityType, CourseLMSSubTopicTypeEnum, CourseLanguages, PlanStatus, PlanType, PublishStatus, PurchaseMode, ReportStatus, ReportType, VoteType, BannerSection, RoadmapStatus, TransactionType, TransactionStatus, WithdrawalStatus, PaymentCountry, PaymentType, QuizPassingStatus, ReelProcessingStatus } from "./enums";

export type AdminUser = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    role: AdminRole;
    profilePic: string | null;
    gender: UserGender | null;
    about: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    phone: string | null;
};
export type AffiliateClick = {
    id: string;
    affiliateId: string;
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    createdAt: Generated<Timestamp>;
};
export type AffiliatePaymentDetails = {
    id: string;
    affiliateId: string;
    type: PaymentType;
    country: PaymentCountry;
    accountNumber: string | null;
    accountName: string | null;
    bankName: string | null;
    ifscCode: string | null;
    pancard: string | null;
    vpa: string | null;
    paypalEmail: string | null;
    payoneerID: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type AffiliateTransaction = {
    id: string;
    affiliateId: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    orderId: string | null;
    productId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type AffiliateUser = {
    id: string;
    userId: string;
    affiliateCode: string;
    commissionRate: number;
    totalEarnings: Generated<number>;
    availableBalance: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type AffiliateWithdrawal = {
    id: string;
    affiliateId: string;
    amount: number;
    status: WithdrawalStatus;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    PayoutType: PaymentType;
};
export type Banner = {
    id: string;
    title: string | null;
    description: string | null;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    targetAudience: string | null;
    impressionCount: number | null;
    bannerSize: string | null;
    type: Generated<BannerType | null>;
    section: BannerSection;
    campaignId: string | null;
    isActive: Generated<boolean | null>;
    priority: number | null;
    altText: string | null;
    imageUrl: string;
    targetLink: string;
    creatorId: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type BannerClick = {
    id: string;
    bannerId: string;
    userId: string;
    createdAt: Timestamp;
};
export type BannerUtmMetric = {
    id: string;
    bannerId: string;
    utmSource: string;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmTerm: string | null;
    utmContent: string | null;
    createdAt: Timestamp;
};
export type Book = {
    id: string;
    title: string;
    author: string | null;
    description: string;
    slug: string;
    pages: number | null;
    purchaseMode: PurchaseMode;
    publishStatus: Generated<PublishStatus>;
    url: string;
    webPriceINR: number | null;
    mobilePriceINR: number | null;
    webPriceUSD: number | null;
    mobilePriceUSD: number | null;
    webDiscount: number | null;
    mobileDiscount: number | null;
    webThumbnailUrl: string | null;
    mobileThumbnailUrl: string | null;
    previewUrl: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    offerings: string[];
    language: Generated<CourseLanguages>;
};
export type book_search_view = {
    id: string;
    title: string | null;
    author: string | null;
    description: string | null;
    author_names: string | null;
};
export type BookAuthor = {
    id: string;
    bookId: string;
    instructorId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type BookBookmark = {
    id: string;
    userId: string;
    bookId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type BookCategory = {
    id: string;
    bookId: string;
    categoryId: string;
};
export type BookPurchase = {
    id: string;
    userId: string;
    bookId: string;
    createdAt: Generated<Timestamp>;
};
export type Bundle = {
    id: string;
    title: string;
    subTitle: string | null;
    description: string | null;
    slug: string;
    purchaseMode: PurchaseMode;
    publishStatus: Generated<PublishStatus>;
    webPriceINR: number | null;
    mobilePriceINR: number | null;
    webPriceUSD: number | null;
    mobilePriceUSD: number | null;
    webDiscount: number | null;
    mobileDiscount: number | null;
    webThumbnailUrl: string | null;
    mobileThumbnailUrl: string | null;
    previewUrl: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    validity: number;
};
export type BundleBookmark = {
    id: string;
    userId: string;
    bundleId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type BundlePurchase = {
    id: string;
    userId: string;
    bundleId: string;
    createdAt: Generated<Timestamp>;
};
export type Cart = {
    id: string;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    bookId: string | null;
    bundleId: string | null;
    courseId: string | null;
    type: BundleEntityType;
};
export type Category = {
    id: string;
    title: string;
    archived: Generated<boolean>;
    archivedAt: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Certificate = {
    id: string;
    courseId: string;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CompanyAssociated = {
    id: string;
    name: string;
    companyLogo: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type ContactForm = {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    status: Generated<QueryStatus>;
    resolvedBy: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Course = {
    id: string;
    title: string;
    subTitle: string | null;
    description: string | null;
    slug: string;
    weight: Generated<number>;
    webPriceINR: number | null;
    mobilePriceINR: number | null;
    webPriceUSD: number | null;
    mobilePriceUSD: number | null;
    webDiscount: number | null;
    mobileDiscount: number | null;
    duration: string;
    webThumbnailUrl: string | null;
    mobileThumbnailUrl: string | null;
    previewUrl: string | null;
    learningOutcomes: string[];
    prerequisites: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    purchaseMode: PurchaseMode;
    status: Generated<PublishStatus>;
    language: Generated<CourseLanguages>;
};
export type course_search_view = {
    id: string;
    title: string | null;
    subTitle: string | null;
};
export type CourseAndBookBundle = {
    id: string;
    type: BundleEntityType;
    courseId: string | null;
    bookId: string | null;
    bundleId: string;
};
export type CourseBookmark = {
    id: string;
    userId: string;
    courseId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseCategory = {
    id: string;
    courseId: string;
    categoryId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseFAQ = {
    id: string;
    courseId: string;
    faqId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseInstructor = {
    id: string;
    courseId: string;
    instructorId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseLMSLecture = {
    id: string;
    title: string;
    duration: string | null;
    videoUrl: string;
    resourcesLinks: Generated<string[]>;
    subTopicId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseLMSQuiz = {
    id: string;
    subTopicId: string;
    title: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseLMSSubtopic = {
    id: string;
    topicId: string;
    order: number;
    type: CourseLMSSubTopicTypeEnum;
    quizId: string | null;
    lectureId: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseLMSTopic = {
    id: string;
    courseId: string;
    order: number;
    title: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseOfferedByCompany = {
    id: string;
    courseId: string;
    companyId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseOffering = {
    id: string;
    courseId: string;
    offeringId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CoursePurchase = {
    id: string;
    userId: string;
    courseId: string;
    createdAt: Timestamp;
};
export type CourseReview = {
    id: string;
    userId: string;
    courseId: string;
    rating: number;
    review: string | null;
    hidden: Generated<boolean>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseReviewVote = {
    id: string;
    userId: string;
    reviewId: string;
    voteType: VoteType;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseSyllabusSubtopic = {
    id: string;
    syllabusTopicId: string;
    title: string;
    previewUrl: string | null;
    order: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CourseSyllabusTopic = {
    id: string;
    courseId: string;
    title: string;
    order: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type FAQ = {
    id: string;
    question: string;
    answer: string;
    answerUrl: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Instructor = {
    id: string;
    fullName: string;
    profileUrl: string | null;
    expertise: string;
    bio: string | null;
    createdAt: string;
    updatedAt: string;
};
export type InstructorExperience = {
    id: string;
    instructorId: string;
    company: string;
    companyLogo: string | null;
    years: number;
    details: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Keyword = {
    id: string;
    keyword: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type LMSQandA = {
    id: string;
    courseId: string;
    lectureId: string;
    userId: string;
    question: string;
    hidden: Generated<boolean>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type LMSQandAReply = {
    id: string;
    questionId: string;
    userId: string;
    reply: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    hidden: Generated<boolean>;
};
export type Offering = {
    id: string;
    iconUrl: string | null;
    text: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type PaymentOrder = {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    type: PurchaseItemTypes;
    courseId: string | null;
    bookId: string | null;
    subscriptionId: string | null;
    status: PaymentStatus;
    gateway: PaymentGateway;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    currency: Generated<PaymentCurrency>;
    affiliateId: string | null;
    commissionRate: Generated<number | null>;
};
export type PhoneVerificationSession = {
    id: string;
    phone: string;
    code: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type PlanInterestForm = {
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    companyName: string;
    companySize: number;
    learnersCount: number;
    jobTitle: string;
    jobLevel: string;
    message: string | null;
    resolvedBy: string | null;
    status: Generated<QueryStatus>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type project_course_search_view = {
    id: string;
    title: string | null;
    subTitle: string | null;
};
export type QuizOption = {
    id: string;
    questionId: string;
    option: string;
    isCorrect: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type QuizQuestion = {
    id: string;
    quizId: string;
    question: string;
    marks: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type RecentlyViewedBook = {
    id: string;
    userId: string;
    bookId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type RecentlyViewedBundle = {
    id: string;
    userId: string;
    bundleId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type RecentlyViewedCourse = {
    id: string;
    userId: string;
    courseId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lectureId: string | null;
};
export type Reel = {
    id: string;
    title: string;
    description: string | null;
    videoId: string;
    thumbnailUrl: string | null;
    addedBy: string | null;
    processingStatus: Generated<ReelProcessingStatus>;
    publishStatus: Generated<PublishStatus>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type ReelCategory = {
    id: string;
    reelId: string;
    categoryId: string;
};
export type ReelComment = {
    id: string;
    userId: string;
    reelId: string;
    comment: string;
    hidden: Generated<boolean>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type ReelCommentVote = {
    id: string;
    userId: string;
    commentId: string;
    voteType: VoteType;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type ReelKeyword = {
    id: string;
    keywordId: string;
    reelId: string;
    relevance: number;
};
export type ReelLike = {
    id: string;
    userId: string;
    reelId: string;
    liked: Generated<boolean>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type ReelShare = {
    id: string;
    userId: string;
    reelId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type ReelView = {
    id: string;
    userId: string;
    reelId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Report = {
    id: string;
    reportedBy: string;
    courseReviewId: string | null;
    lmsQandAId: string | null;
    reelCommentId: string | null;
    reason: string;
    description: string;
    status: Generated<ReportStatus>;
    type: ReportType;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lmsQandAReplyId: string | null;
};
export type ResetUserPassword = {
    id: string;
    email: string;
    token: string;
    expiresAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Roadmap = {
    id: string;
    title: string;
    link: string;
    status: Generated<RoadmapStatus>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    description: string | null;
    thumbnail: string | null;
};
export type SubscriptionPlan = {
    id: string;
    name: string;
    description: string | null;
    type: PlanType;
    features: string[];
    extraInfo: string | null;
    monthlyChargeINR: number;
    monthlyChargeUSD: number;
    webPriceINR: number;
    mobilePriceINR: number;
    webPriceUSD: number;
    mobilePriceUSD: number;
    webDiscount: Generated<number>;
    mobileDiscount: Generated<number>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    status: Generated<PlanStatus>;
    strength: number;
};
export type User = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    password: string | null;
    authProvider: Generated<AuthProvider>;
    profilePic: string | null;
    gender: UserGender | null;
    about: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    phone: string | null;
    phoneVerified: Generated<boolean>;
    lastLoginAt: Timestamp | null;
    referredAt: Timestamp | null;
    referredByAffiliateId: string | null;
};
export type UserBookAccess = {
    id: string;
    userId: string;
    bookId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type UserBundleAccess = {
    id: string;
    userId: string;
    bundleId: string;
    validTill: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type UserCourseAccess = {
    id: string;
    userId: string;
    courseId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type UserKeywordScore = {
    id: string;
    userId: string;
    keywordId: string;
    score: number;
};
export type UserPlanAccess = {
    id: string;
    userId: string;
    planId: string;
    validTill: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastPurchasedAt: Timestamp;
};
export type UserQuizResponse = {
    id: string;
    userId: string;
    quizId: string;
    questionId: string;
    optionId: string;
    isCorrect: boolean;
    marks: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type UserQuizStatus = {
    id: string;
    userId: string;
    courseId: string;
    quizId: string;
    status: QuizPassingStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type UserVideoProgress = {
    id: string;
    userId: string;
    courseId: string;
    subTopicId: string;
    lectureId: string;
    watchedDuration: Generated<number>;
    completed: Generated<boolean>;
    lastWatchedAt: Generated<Timestamp>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type DB = {
    AdminUser: AdminUser;
    AffiliateClick: AffiliateClick;
    AffiliatePaymentDetails: AffiliatePaymentDetails;
    AffiliateTransaction: AffiliateTransaction;
    AffiliateUser: AffiliateUser;
    AffiliateWithdrawal: AffiliateWithdrawal;
    Banner: Banner;
    BannerClick: BannerClick;
    BannerUtmMetric: BannerUtmMetric;
    Book: Book;
    book_search_view: book_search_view;
    BookAuthor: BookAuthor;
    BookBookmark: BookBookmark;
    BookCategory: BookCategory;
    BookPurchase: BookPurchase;
    Bundle: Bundle;
    BundleBookmark: BundleBookmark;
    BundlePurchase: BundlePurchase;
    Cart: Cart;
    Category: Category;
    Certificate: Certificate;
    CompanyAssociated: CompanyAssociated;
    ContactForm: ContactForm;
    Course: Course;
    course_search_view: course_search_view;
    CourseAndBookBundle: CourseAndBookBundle;
    CourseBookmark: CourseBookmark;
    CourseCategory: CourseCategory;
    CourseFAQ: CourseFAQ;
    CourseInstructor: CourseInstructor;
    CourseLMSLecture: CourseLMSLecture;
    CourseLMSQuiz: CourseLMSQuiz;
    CourseLMSSubtopic: CourseLMSSubtopic;
    CourseLMSTopic: CourseLMSTopic;
    CourseOfferedByCompany: CourseOfferedByCompany;
    CourseOffering: CourseOffering;
    CoursePurchase: CoursePurchase;
    CourseReview: CourseReview;
    CourseReviewVote: CourseReviewVote;
    CourseSyllabusSubtopic: CourseSyllabusSubtopic;
    CourseSyllabusTopic: CourseSyllabusTopic;
    FAQ: FAQ;
    Instructor: Instructor;
    InstructorExperience: InstructorExperience;
    Keyword: Keyword;
    LMSQandA: LMSQandA;
    LMSQandAReply: LMSQandAReply;
    Offering: Offering;
    PaymentOrder: PaymentOrder;
    PhoneVerificationSession: PhoneVerificationSession;
    PlanInterestForm: PlanInterestForm;
    project_course_search_view: project_course_search_view;
    QuizOption: QuizOption;
    QuizQuestion: QuizQuestion;
    RecentlyViewedBook: RecentlyViewedBook;
    RecentlyViewedBundle: RecentlyViewedBundle;
    RecentlyViewedCourse: RecentlyViewedCourse;
    Reel: Reel;
    ReelCategory: ReelCategory;
    ReelComment: ReelComment;
    ReelCommentVote: ReelCommentVote;
    ReelKeyword: ReelKeyword;
    ReelLike: ReelLike;
    ReelShare: ReelShare;
    ReelView: ReelView;
    Report: Report;
    ResetUserPassword: ResetUserPassword;
    Roadmap: Roadmap;
    SubscriptionPlan: SubscriptionPlan;
    User: User;
    UserBookAccess: UserBookAccess;
    UserBundleAccess: UserBundleAccess;
    UserCourseAccess: UserCourseAccess;
    UserKeywordScore: UserKeywordScore;
    UserPlanAccess: UserPlanAccess;
    UserQuizResponse: UserQuizResponse;
    UserQuizStatus: UserQuizStatus;
    UserVideoProgress: UserVideoProgress;
};
