import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Web Search')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute AI-assisted web search (with automatic 24-hr caching)',
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(
    @CurrentUser('id') userId: string,
    @Body() dto: SearchQueryDto,
  ) {
    return this.searchService.executeSearch(userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get complete web search history for logged-in user' })
  @ApiResponse({ status: 200, description: 'List of past searches' })
  async getHistory(@CurrentUser('id') userId: string) {
    return this.searchService.getSearchHistory(userId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get top 5 recent search keywords' })
  @ApiResponse({ status: 200, description: 'Recent search keywords returned' })
  async getRecent(@CurrentUser('id') userId: string) {
    return this.searchService.getRecentSearches(userId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get auto-suggestions based on partial search query' })
  @ApiQuery({ name: 'q', required: true, example: 'NestJS' })
  @ApiResponse({ status: 200, description: 'Matching query suggestions' })
  async getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query);
  }
}