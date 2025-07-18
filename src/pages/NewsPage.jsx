import { Box, Typography, Card, CardContent, Button, Grid, Chip, Stack } from '@mui/joy';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../core/presentation/hooks/useAuth';
import { GET_PUBLISHED_NEWS, GET_CATEGORIES, GET_TAGS } from '../graphql/queries';
import { formatDate, truncateText } from '../utils/constants';
import { SEO, LoadingSpinner, ErrorDisplay, Pagination } from '../components/index.js';
import SearchAndFilter from '../components/SearchAndFilter';
import { processImageUrlForDisplay } from '../utils/cloudinaryUtils';
import { useTranslation } from 'react-i18next';

export default function NewsPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchFilters, setSearchFilters] = useState({
    search: null,
    categoryId: null,
    tagId: searchParams.get('tag') ? parseInt(searchParams.get('tag')) : null,
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Fixed to 6 items per page as requested

  // Fetch categories to find ID by slug
  const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_CATEGORIES);
  const { data: tagsData, loading: tagsLoading } = useQuery(GET_TAGS);
  const categories = categoriesData?.categories || [];
  const tags = tagsData?.tags || [];

  // Update search filters when URL parameters change
  useEffect(() => {
    const categorySlug = searchParams.get('category');
    if (categorySlug && categories.length > 0) {
      const category = categories.find(cat => cat.slug === categorySlug);
      if (category) {
        setSearchFilters(prev => ({ ...prev, categoryId: parseInt(category.id) }));
      }
    } else {
      setSearchFilters(prev => ({ ...prev, categoryId: null }));
    }
  }, [searchParams, categories]);

  const { data: newsData, loading: newsLoading, error: newsError, refetch: refetchNews } = useQuery(GET_PUBLISHED_NEWS, {
    variables: searchFilters,
    onCompleted: (data) => {
      console.log('News data loaded:', data);
      if (data?.publishedNews) {
        data.publishedNews.forEach((news, index) => {
          if (news.featuredImageUrl) {
            console.log(`Article ${index} - Image URL:`, news.featuredImageUrl);
          }
        });
      }
    },
    onError: (error) => {
      console.error('News query error:', error);
    }
  });

  const publishedNews = newsData?.publishedNews || [];

  // Client-side sorting function
  const sortNews = (news, sortBy) => {
    const sortedNews = [...news];
    
    switch (sortBy) {
      case 'oldest':
        return sortedNews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'title_asc':
        return sortedNews.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return sortedNews.sort((a, b) => b.title.localeCompare(a.title));
      case 'author_asc':
        return sortedNews.sort((a, b) => {
          const aName = `${a.author?.firstName || ''} ${a.author?.lastName || ''}`.trim();
          const bName = `${b.author?.firstName || ''} ${b.author?.lastName || ''}`.trim();
          return aName.localeCompare(bName);
        });
      case 'author_desc':
        return sortedNews.sort((a, b) => {
          const aName = `${a.author?.firstName || ''} ${a.author?.lastName || ''}`.trim();
          const bName = `${b.author?.firstName || ''} ${b.author?.lastName || ''}`.trim();
          return bName.localeCompare(aName);
        });
      case 'newest':
      default:
        return sortedNews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // Apply sorting to published news
  const sortedNews = sortNews(publishedNews, searchFilters.sortBy);

  // Pagination calculations
  const totalItems = sortedNews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = sortedNews.slice(startIndex, endIndex);

  // Check if user can create articles
  const userRole = user?.profile?.role?.toLowerCase();
  const canCreateArticles = isAuthenticated && ['writer', 'manager', 'admin'].includes(userRole);

  const handleSearch = (searchTerm) => {
    setSearchFilters(prev => ({ ...prev, search: searchTerm || null }));
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilter = (filters) => {
    setSearchFilters(filters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box>
      {/* SEO Meta Tags */}
      <SEO 
        title={t('news.title')}
        description={t('news.subtitle')}
        keywords={['news', 'articles', 'stories', 'current events', 'breaking news']}
        type="website"
      />
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography level="h1" sx={{ mb: 2, color: 'var(--joy-palette-text-primary)' }}>
              {t('news.title')}
            </Typography>
            <Typography level="body1" sx={{ color: 'var(--joy-palette-text-secondary)' }}>
              {t('news.subtitle')}
            </Typography>
          </Box>
          {canCreateArticles && (
            <Button
              component={Link}
              to="/articles/create"
              variant="solid"
              sx={{ mt: 1 }}
            >
              {t('news.createArticle')}
            </Button>
          )}
        </Stack>
      </Box>
{/* 
      Filter Indicator
      {searchFilters.tagId && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography level="body2" sx={{ color: 'var(--joy-palette-text-secondary)' }}>
              Filtered by tag:
            </Typography>
            <Chip 
              size="sm" 
              variant="soft" 
              color="primary"
              endDecorator={
                <Button
                  size="sm"
                  variant="plain"
                  color="neutral"
                  component={Link}
                  to="/news"
                  sx={{ minHeight: 'auto', p: 0.5 }}
                >
                  ✕
                </Button>
              }
            >
              #{tags.find(tag => tag.id === searchFilters.tagId.toString())?.name || 'Unknown Tag'}
            </Chip>
          </Stack>
        </Box>
      )} */}

      {/* Search and Filter Component */}
      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        categories={categories}
        tags={tags}
        loading={newsLoading}
        initialFilters={searchFilters}
      />

      {/* Loading State */}
      {newsLoading && (
        <LoadingSpinner
          size="lg"
          message={t('news.loading')}
          variant="card"
          type="news"
        />
      )}

      {/* Error State */}
      {newsError && (
        <ErrorDisplay
          error={newsError}
          title={t('news.error')}
          message={t('news.checkConnection')}
          showRefresh={true}
          onRefresh={() => refetchNews()}
          color="warning"
          size="md"
        />
      )}

      {/* Empty State */}
      {!newsLoading && !newsError && currentNews.length === 0 && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography level="h4" sx={{ mb: 2, color: 'var(--joy-palette-text-secondary)' }}>
              {t('news.noNews')}
            </Typography>
            <Typography level="body1" sx={{ color: 'var(--joy-palette-text-tertiary)' }}>
              {t('news.tryDifferentFilters')}
            </Typography>
            {canCreateArticles && (
              <Button
                component={Link}
                to="/articles/create"
                variant="solid"
                sx={{ mt: 2 }}
              >
                {t('news.createFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* News Grid */}
      {!newsLoading && !newsError && currentNews.length > 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {currentNews.map((news) => (
              <Grid key={news.id} xs={12} sm={6} lg={4}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 'var(--joy-shadow-md)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                {news.featuredImageUrl ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 200,
                      overflow: 'hidden',
                      borderRadius: 'var(--joy-radius-sm) var(--joy-radius-sm) 0 0',
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '30px',
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s ease',
                        zIndex: 1,
                      },
                      '&::before': {
                        top: 0,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)',
                      },
                      '&::after': {
                        bottom: 0,
                        background: 'linear-gradient(to top, rgba(255,255,255,0.6), transparent)',
                      },
                      '&:hover::before, &:hover::after': {
                        opacity: 0,
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={processImageUrlForDisplay(news.featuredImageUrl)}
                      alt={news.title}
                      onError={(e) => {
                       
                        e.target.src = '/default-news.svg';
                        e.target.onerror = () => {
              
                          e.target.style.display = 'none';
                        };
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', processImageUrlForDisplay(news.featuredImageUrl));
                      }}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        backgroundColor: 'var(--joy-palette-background-level2)', // Fallback background
                        filter: 'blur(0.5px)',
                        transform: 'scale(1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          filter: 'blur(0px)',
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      backgroundColor: 'var(--joy-palette-background-level2)',
                      borderRadius: 'var(--joy-radius-sm) var(--joy-radius-sm) 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--joy-palette-text-tertiary)',
                    }}
                  >
                    📰 {/* News icon placeholder */}
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography level="title-md" sx={{ mb: 1, color: 'var(--joy-palette-text-primary)' }}>
                    {news.title}
                  </Typography>
                  <Typography 
                    level="body2" 
                    sx={{ 
                      mb: 2, 
                      flexGrow: 1, 
                      color: 'var(--joy-palette-text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {truncateText(news.excerpt || news.content, 150)}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography level="body3" sx={{ color: 'var(--joy-palette-text-tertiary)' }}>
                      {t('news.by')} {news.author?.firstName} {news.author?.lastName}
                    </Typography>
                    <Typography level="body3" sx={{ color: 'var(--joy-palette-text-tertiary)' }}>
                      {formatDate(news.publishedAt)}
                    </Typography>
                  </Box>
                  {news.category && (
                    <Chip 
                      size="sm" 
                      variant="soft"
                      sx={{ 
                        alignSelf: 'flex-start', 
                        mb: 2,
                        backgroundColor: 'var(--joy-palette-background-level2)',
                        color: 'var(--joy-palette-text-secondary)',
                      }}
                    >
                      {news.category.name}
                    </Chip>
                  )}
                  <Button
                    component={Link}
                    to={`/news/${news.slug}`}
                    variant="outlined"
                    size="sm"
                    fullWidth
                    sx={{
                      mt: 'auto',
                      borderColor: 'var(--joy-palette-primary-300)',
                      color: 'var(--joy-palette-primary-700)',
                      '&:hover': {
                        backgroundColor: 'var(--joy-palette-primary-50)',
                        borderColor: 'var(--joy-palette-primary-500)',
                      }
                    }}
                  >
                    {t('news.readMore')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            ))}
          </Grid>
          
          {/* Pagination Component */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showFirstLast={true}
                showPrevNext={true}
                maxButtons={5}
                size="md"
                variant="outlined"
              />
            </Box>
          )}
          
          {/* Results Info */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography level="body3" sx={{ color: 'var(--joy-palette-text-tertiary)' }}>
              {t('news.showing')} {startIndex + 1}-{Math.min(endIndex, totalItems)} {t('news.of')} {totalItems} {t('news.articles')}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
