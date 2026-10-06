import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { MessageEvent } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationQueryDto } from "./dto/notification-query.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Observable } from "rxjs";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Endpoint SSE trả về stream sự kiện thông báo thời gian thực
   */
  @Sse("stream")
  stream(@Req() req: any): Observable<MessageEvent> {
    return this.notificationsService.getStream(req.user.id);
  }

  /**
   * Lấy danh sách thông báo của user
   */
  @Get()
  findAll(@Req() req: any, @Query() query: NotificationQueryDto) {
    return this.notificationsService.getUserNotifications(req.user.id, query);
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  @Get("unread-count")
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  @Patch(":id/read")
  markAsRead(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  @Patch("read-all")
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * Xóa thông báo
   */
  @Delete(":id")
  delete(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    return this.notificationsService.deleteNotification(req.user.id, id);
  }
}
