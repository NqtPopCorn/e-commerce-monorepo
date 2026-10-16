import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { QueryReviewsDto, ReviewSortOption } from "./dto/query-reviews.dto";
import {
  AdminQueryReviewsDto,
  AdminReplyDto,
} from "./dto/admin-reviews.dto";
import { Prisma, ReviewStatus } from "@prisma/client";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đánh giá mới cho một sản phẩm trong đơn hàng đã hoàn tất
   */
  async create(userId: number, dto: CreateReviewDto) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: {
        order: true,
        variant: true,
        review: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundException("Mục đơn hàng không tồn tại");
    }

    if (orderItem.order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền đánh giá đơn hàng này");
    }

    if (orderItem.order.status !== "COMPLETED") {
      throw new BadRequestException(
        "Chỉ có thể đánh giá sản phẩm khi đơn hàng đã giao thành công (COMPLETED)",
      );
    }

    if (orderItem.review) {
      throw new BadRequestException("Sản phẩm này trong đơn hàng đã được đánh giá");
    }

    const productId = orderItem.variant.productId;

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          productId,
          userId,
          orderId: orderItem.orderId,
          orderItemId: dto.orderItemId,
          rating: dto.rating,
          content: dto.content?.trim() || null,
          images: dto.images || [],
          fit: dto.fit || null,
          userHeight: dto.userHeight || null,
          userWeight: dto.userWeight || null,
          status: "APPROVED",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          orderItem: {
            include: {
              variant: true,
            },
          },
        },
      });

      await this.updateProductRatingStats(tx, productId);

      return review;
    });
  }

  /**
   * Cập nhật đánh giá (trong vòng 30 ngày)
   */
  async update(userId: number, reviewId: number, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Đánh giá không tồn tại");
    }

    if (review.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền chỉnh sửa đánh giá này");
    }

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const ageInMs = Date.now() - new Date(review.createdAt).getTime();
    if (ageInMs > thirtyDaysInMs) {
      throw new BadRequestException(
        "Đã quá thời hạn 30 ngày kể từ ngày đánh giá, không thể chỉnh sửa",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: dto.rating !== undefined ? dto.rating : undefined,
          content:
            dto.content !== undefined ? dto.content.trim() || null : undefined,
          images: dto.images !== undefined ? dto.images : undefined,
          fit: dto.fit !== undefined ? dto.fit : undefined,
          userHeight: dto.userHeight !== undefined ? dto.userHeight : undefined,
          userWeight: dto.userWeight !== undefined ? dto.userWeight : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          orderItem: {
            include: {
              variant: true,
            },
          },
        },
      });

      if (dto.rating !== undefined && dto.rating !== review.rating) {
        await this.updateProductRatingStats(tx, review.productId);
      }

      return updated;
    });
  }

  /**
   * Cập nhật thống kê ratingAverage và reviewCount cho Product
   */
  private async updateProductRatingStats(
    tx: Prisma.TransactionClient,
    productId: number,
  ) {
    const stats = await tx.review.aggregate({
      where: {
        productId,
        status: "APPROVED",
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    const ratingAverage = stats._avg.rating
      ? Number(stats._avg.rating.toFixed(2))
      : 0;
    const reviewCount = stats._count.id;

    await tx.product.update({
      where: { id: productId },
      data: {
        ratingAverage,
        reviewCount,
      },
    });
  }

  /**
   * Lấy danh sách reviews công khai của sản phẩm kèm thống kê
   */
  async getProductReviews(
    productId: number,
    query: QueryReviewsDto,
    currentUserId?: number,
  ) {
    const { page = 1, limit = 10, rating, hasImages, fit, sort } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      productId,
      status: "APPROVED",
    };

    if (rating) {
      where.rating = rating;
    }

    if (hasImages) {
      where.images = { isEmpty: false };
    }

    if (fit) {
      where.fit = fit;
    }

    let orderBy: Prisma.ReviewOrderByWithRelationInput | Prisma.ReviewOrderByWithRelationInput[] = {
      createdAt: "desc",
    };

    if (sort === ReviewSortOption.HIGHEST) {
      orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (sort === ReviewSortOption.LOWEST) {
      orderBy = [{ rating: "asc" }, { createdAt: "desc" }];
    } else if (sort === ReviewSortOption.MOST_HELPFUL) {
      orderBy = [{ likesCount: "desc" }, { createdAt: "desc" }];
    }

    const [reviews, total, allApprovedReviews] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          orderItem: {
            include: {
              variant: true,
            },
          },
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
              }
            : false,
        },
      }),
      this.prisma.review.count({ where }),
      // Lấy toàn bộ reviews approved của sản phẩm này để tính statistics tổng quát
      this.prisma.review.findMany({
        where: { productId, status: "APPROVED" },
        select: { rating: true, fit: true, images: true },
      }),
    ]);

    // Thống kê phân bố sao và fit
    const starDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    const fitDistribution = {
      TIGHT: 0,
      TRUE_TO_SIZE: 0,
      LOOSE: 0,
    };
    let withImagesCount = 0;
    let totalScore = 0;

    allApprovedReviews.forEach((r) => {
      totalScore += r.rating;
      if (starDistribution[r.rating] !== undefined) {
        starDistribution[r.rating]++;
      }
      if (r.fit && fitDistribution[r.fit] !== undefined) {
        fitDistribution[r.fit]++;
      }
      if (r.images && r.images.length > 0) {
        withImagesCount++;
      }
    });

    const totalApproved = allApprovedReviews.length;
    const averageRating =
      totalApproved > 0 ? Number((totalScore / totalApproved).toFixed(2)) : 0;

    const items = reviews.map((r: any) => ({
      ...r,
      isLiked: Boolean(r.likes && r.likes.length > 0),
      likes: undefined,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics: {
        averageRating,
        totalReviews: totalApproved,
        starDistribution,
        fitDistribution,
        withImagesCount,
      },
    };
  }

  /**
   * Kiểm tra điều kiện đánh giá của khách cho sản phẩm cụ thể
   */
  async checkEligibility(userId: number, productId: number) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: "COMPLETED",
        },
        variant: {
          productId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        variant: true,
        review: true,
      },
      orderBy: {
        order: {
          createdAt: "desc",
        },
      },
    });

    const eligibleItems = orderItems.map((item) => {
      const isReviewed = Boolean(item.review);
      const isEditable =
        isReviewed &&
        Date.now() - new Date(item.review!.createdAt).getTime() <=
          30 * 24 * 60 * 60 * 1000;

      return {
        orderItemId: item.id,
        orderId: item.orderId,
        orderDate: item.order.createdAt,
        size: item.variant.size,
        color: item.variant.color,
        sku: item.variant.sku,
        imageUrl: item.variant.imageUrl,
        isReviewed,
        isEditable,
        review: item.review,
      };
    });

    const canReview = eligibleItems.some((item) => !item.isReviewed);

    return {
      canReview,
      eligibleItems,
    };
  }

  /**
   * Bấm hoặc huỷ "Hữu ích" (Like) cho một đánh giá
   */
  async toggleLike(userId: number, reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, status: true, likesCount: true },
    });

    if (!review || review.status !== "APPROVED") {
      throw new NotFoundException("Đánh giá không tồn tại hoặc đã bị ẩn");
    }

    const existingLike = await this.prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.reviewLike.delete({
          where: { id: existingLike.id },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return {
        liked: false,
        likesCount: Math.max(0, review.likesCount - 1),
      };
    } else {
      await this.prisma.$transaction([
        this.prisma.reviewLike.create({
          data: {
            reviewId,
            userId,
          },
        }),
        this.prisma.review.update({
          where: { id: reviewId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      return {
        liked: true,
        likesCount: review.likesCount + 1,
      };
    }
  }

  // ================= ADMIN FUNCTIONS =================

  /**
   * Admin lấy danh sách toàn bộ reviews có bộ lọc và thống kê KPI
   */
  async adminFindAll(query: AdminQueryReviewsDto) {
    const {
      page = 1,
      limit = 20,
      search,
      productId,
      rating,
      status,
      hasReply,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (rating) {
      where.rating = rating;
    }

    if (status) {
      where.status = status;
    }

    if (hasReply !== undefined) {
      where.replyContent = hasReply ? { not: null } : null;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const num = parseInt(s, 10);
      where.OR = [
        { content: { contains: s, mode: "insensitive" } },
        { user: { firstName: { contains: s, mode: "insensitive" } } },
        { user: { lastName: { contains: s, mode: "insensitive" } } },
        { user: { email: { contains: s, mode: "insensitive" } } },
        { product: { name: { contains: s, mode: "insensitive" } } },
        ...(isNaN(num) ? [] : [{ orderId: num }, { id: num }]),
      ];
    }

    const [reviews, total, aggregateStats, unrepliedCount, hiddenCount] =
      await Promise.all([
        this.prisma.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            orderItem: {
              include: {
                variant: true,
              },
            },
          },
        }),
        this.prisma.review.count({ where }),
        this.prisma.review.aggregate({
          _avg: { rating: true },
          _count: { id: true },
        }),
        this.prisma.review.count({
          where: { replyContent: null, status: "APPROVED" },
        }),
        this.prisma.review.count({
          where: { status: "HIDDEN" },
        }),
      ]);

    return {
      items: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalReviews: aggregateStats._count.id,
        averageRating: aggregateStats._avg.rating
          ? Number(aggregateStats._avg.rating.toFixed(2))
          : 0,
        unrepliedCount,
        hiddenCount,
      },
    };
  }

  /**
   * Shop phản hồi đánh giá của khách hàng
   */
  async adminReply(adminId: number, reviewId: number, dto: AdminReplyDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Đánh giá không tồn tại");
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        replyContent: dto.replyContent.trim(),
        repliedAt: new Date(),
        repliedBy: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: true,
      },
    });
  }

  /**
   * Admin chuyển đổi trạng thái đánh giá (APPROVED / HIDDEN)
   */
  async adminUpdateStatus(reviewId: number, status: ReviewStatus) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Đánh giá không tồn tại");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: { status },
      });

      await this.updateProductRatingStats(tx, review.productId);

      return updated;
    });
  }
}
