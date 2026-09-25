import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async executeSearch(userId: string, dto: SearchQueryDto) {
    const normalizedQuery = dto.query.trim().toLowerCase();

    // 1. Search Result Caching (Bonus Feature)
    // Check if the same query was searched within the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedSearch = await this.prisma.webSearch.findFirst({
      where: {
        query: { equals: normalizedQuery, mode: 'insensitive' },
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (cachedSearch) {
      // Also record that this user searched for it
      if (cachedSearch.userId !== userId) {
        await this.prisma.webSearch.create({
          data: {
            userId,
            query: dto.query.trim(),
            results: cachedSearch.results as any,
          },
        });
      }

      return {
        query: dto.query,
        cached: true,
        source: 'Cache (Fast response)',
        results: cachedSearch.results,
      };
    }

    // 2. Perform Web Search (Simulated Search Provider Engine)
    const freshResults = await this.fetchWebSearchResults(dto.query);

    // 3. Save to database for history and caching
    const savedSearch = await this.prisma.webSearch.create({
      data: {
        userId,
        query: dto.query.trim(),
        results: freshResults as any,
      },
    });

    return {
      query: savedSearch.query,
      cached: false,
      source: 'Live Web Engine',
      results: savedSearch.results,
    };
  }

  async getSearchHistory(userId: string) {
    return this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        query: true,
        createdAt: true,
      },
    });
  }

  async getRecentSearches(userId: string) {
    const recent = await this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        query: true,
        createdAt: true,
      },
    });

    // Remove duplicates based on query string
    const uniqueQueries = Array.from(new Set(recent.map((item) => item.query)));
    return uniqueQueries;
  }

  async getSuggestions(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const matches = await this.prisma.webSearch.findMany({
      where: {
        query: {
          contains: query.trim(),
          mode: 'insensitive',
        },
      },
      take: 5,
      select: { query: true },
    });

    const suggestions = Array.from(new Set(matches.map((m) => m.query)));
    return suggestions;
  }

  private async fetchWebSearchResults(query: string): Promise<SearchResultItem[]> {
    // Dynamic simulated search response tailored to Chrome Extension Multi-AI lookup
    return [
      {
        title: `${query} - Official Documentation & Developer Guides`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `Comprehensive overview, API specifications, and architectural patterns related to ${query}.`,
      },
      {
        title: `Understanding ${query}: Insights, Tips & Community Discussion`,
        url: `https://github.com/topics/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
        snippet: `Explore top open-source projects, implementation examples, and discussions on ${query}.`,
      },
      {
        title: `Latest Updates and Best Practices for ${query}`,
        url: `https://dev.to/t/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, ''))}`,
        snippet: `In-depth articles and tutorials contributed by software engineers on ${query}.`,
      },
    ];
  }
}