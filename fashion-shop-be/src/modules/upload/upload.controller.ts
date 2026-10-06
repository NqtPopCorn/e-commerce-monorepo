import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { UploadService } from "./upload.service";
import { DeleteFileDto, UploadQueryDto } from "./dto/upload.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@ApiTags("Upload")
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get("driver-info")
  @ApiOperation({ summary: "Lấy thông tin storage driver đang hoạt động" })
  getDriverInfo() {
    return {
      success: true,
      data: this.uploadService.getDriverInfo(),
    };
  }

  @Post("single")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF", "CUSTOMER")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Upload 1 file ảnh (Admin/Staff: tất cả folder, Customer: chỉ avatars)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        folder: { type: "string", example: "products" },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadQueryDto,
    @Body("folder") bodyFolder?: string,
    @Req() req?: any,
  ) {
    if (!file) {
      throw new BadRequestException("Vui lòng chọn một file ảnh để tải lên");
    }

    const targetFolder = bodyFolder || query.folder || "general";
    const userRole = req?.user?.role;

    // Customer chỉ được phép upload vào thư mục avatars
    if (userRole === "CUSTOMER" && targetFolder !== "avatars") {
      throw new ForbiddenException(
        'Khách hàng chỉ có quyền tải ảnh đại diện vào thư mục "avatars"',
      );
    }

    const result = await this.uploadService.uploadSingle(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fieldname: file.fieldname,
      },
      { folder: targetFolder },
    );

    return {
      success: true,
      message: "Tải lên thành công",
      data: result,
    };
  }

  @Post("multiple")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upload nhiều file ảnh (tối đa 10 files)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
        folder: { type: "string", example: "products" },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query() query: UploadQueryDto,
    @Body("folder") bodyFolder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("Vui lòng chọn ít nhất một file ảnh");
    }

    const targetFolder = bodyFolder || query.folder || "general";

    const storageFiles = files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
    }));

    const results = await this.uploadService.uploadMultiple(storageFiles, {
      folder: targetFolder,
    });

    return {
      success: true,
      message: `Đã tải lên thành công ${results.length} files`,
      data: results,
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Xóa file thủ công theo key (chỉ dành cho quản trị viên)",
  })
  async deleteFile(@Body() dto: DeleteFileDto) {
    const success = await this.uploadService.deleteFile(dto.key);
    return {
      success,
      message: success
        ? `Đã xóa file với key "${dto.key}" thành công`
        : `Không tìm thấy file hoặc xóa không thành công`,
    };
  }
}
