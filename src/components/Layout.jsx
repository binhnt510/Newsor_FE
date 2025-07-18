import { Box, Typography, Button, Sheet, IconButton, Avatar, Dropdown, Menu, MenuButton, MenuItem, Chip } from '@mui/joy';
import { useColorScheme } from '@mui/joy/styles';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/presentation/hooks/useAuth';
import { useQuery } from '@apollo/client';
import { GET_CATEGORIES } from '../graphql/queries';
import { processImageUrlForDisplay } from '../utils/cloudinaryUtils';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

export default function Layout({ children }) {
  const { mode, setMode } = useColorScheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const categories = categoriesData?.categories || [];

  const toggleColorScheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.username;
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return user.username?.charAt(0)?.toUpperCase() || 'U';
  };
  const FilteredBox = ({ ownerState, ...rest }) => <Box {...rest} />;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.body' }}>
      {/* Header */}
      <Sheet
        component="header"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'neutral.200',
          bgcolor: 'background.surface',
        }}
      >
        <Typography
          level="h3"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'text.primary',
            fontWeight: 'bold',
            '&:hover': { color: 'primary.600' }
          }}
        >
          📰 {t('app.title')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Navigation Links */}
          <Button
            variant="plain"
            component={Link}
            to="/"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', bgcolor: 'neutral.100' }
            }}
          >
            {t('navigation.home')}
          </Button>
          
          {/* News Dropdown with Categories */}
          <Dropdown>
            <MenuButton
              slots={{ root: Button }}
              slotProps={{
                root: {
                  variant: 'plain',
                  sx: { 
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary', bgcolor: 'neutral.100' }
                  }
                }
              }}
            >
              {t('navigation.news')}
            </MenuButton>
            <Menu placement="bottom-start" sx={{ zIndex: 1300 }}>
              <MenuItem onClick={() => navigate('/news')}>
                🗞️ {t('news.title')}
              </MenuItem>
              {categories.length > 0 && (
                <>
                  <MenuItem disabled sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {t('categories.all').toUpperCase()}
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem 
                      key={category.id}
                      onClick={() => navigate(`/news?category=${category.slug}`)}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </>
              )}
            </Menu>
          </Dropdown>
          
          {/* History - chỉ hiện khi đăng nhập */}
          {isAuthenticated && (
            <>
              <Button
                variant="plain"
                component={Link}
                to="/comment-history"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: 'neutral.100' }
                }}
              >
                 {t('navigation.commentHistory')}
              </Button>
              <Button
                variant="plain"
                component={Link}
                to="/reading-history"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: 'neutral.100' }
                }}
              >
                 {t('navigation.readingHistory')}
              </Button>
            </>
          )}
          {/* Role-based Article Actions */}
          {isAuthenticated && (
            <>
              {/* Writers can access their articles */}
              {user?.profile?.role?.toLowerCase() === 'writer' && (
                <Button
                  variant="soft"
                  component={Link}
                  to="/my-articles"
                  sx={{ 
                    color: 'primary.600',
                    bgcolor: 'primary.100',
                    '&:hover': { bgcolor: 'primary.200' }
                  }}
                >
                  🪶 {t('navigation.myArticles')}
                </Button>
              )}
              
              {/* Managers can review articles */}
              {['manager', 'admin'].includes(user?.profile?.role?.toLowerCase()) && (
                <Button
                  variant="soft"
                  component={Link}
                  to="/review"
                  sx={{ 
                    color: 'warning.600',
                    bgcolor: 'warning.100',
                    '&:hover': { bgcolor: 'warning.200' }
                  }}
                >
                  🔖 {t('navigation.reviewArticles')}
                </Button>
              )}
              
              {/* Additional navigation for authenticated users */}
              {/* <Button
                variant="plain"
                component={Link}
                to="/profile"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: 'neutral.100' }
                }}
              >
                {t('navigation.profile')}
              </Button> */}
              {user?.profile?.role?.toLowerCase() === 'admin' && (
                <Button
                  variant="plain"
                  component={Link}
                  to="/admin"
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary', bgcolor: 'neutral.100' }
                  }}
                >
                  {t('navigation.adminDashboard')}
                </Button>
              )}
            </>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          {/* <IconButton
            onClick={toggleColorScheme}
            sx={{ 
              borderRadius: '50%',
              bgcolor: 'neutral.100',
              '&:hover': { bgcolor: 'neutral.200' }
            }}
          >
            {mode === 'dark' ? '☀️' : '🌑'}
          </IconButton> */}

          {/* Auth Section */}
          {isAuthenticated ? (
            /* User Profile Dropdown */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notification Bell - only for managers and admins */}
              {user?.profile?.role && ['manager', 'admin', 'writer'].includes(user.profile.role.toLowerCase()) && (
                <NotificationBell />
              )}
              
              {/* User Role Badge */}
              {user?.profile?.role && (
                <Chip
                  size="sm"
                  variant="soft"
                  color={
                    user.profile.role.toLowerCase() === 'admin' ? 'danger' :
                    user.profile.role.toLowerCase() === 'manager' ? 'warning' :
                    user.profile.role.toLowerCase() === 'writer' ? 'success' : 'neutral'
                  }
                >
                  {user.profile.role.charAt(0).toUpperCase() + user.profile.role.slice(1).toLowerCase()}
                </Chip>
              )}
              
              <Dropdown>
                <MenuButton
                  slots={{ root: FilteredBox }}
                  slotProps={{
                    root: {
                      sx: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 'sm',
                        '&:hover': { bgcolor: 'neutral.100' }
                      }
                    }
                  }}
                >
                  <Avatar
                    size="sm"
                    src={processImageUrlForDisplay(user?.profile?.avatarUrl)}
                    sx={{ 
                      bgcolor: 'primary.500',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                    onError={(e) => {
                      console.log('Avatar load error, falling back to initials:', e.target.src);
                      e.target.style.display = 'none'; // This will show the initials
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <Typography level="body-sm" sx={{ fontWeight: 'md', color: 'text.primary' }}>
                    {getUserDisplayName()}
                  </Typography>
                  <span style={{fontSize: '1.1em', color: '#888', marginLeft: '-4px' }}>▾</span>
                </MenuButton>
                <Menu placement="bottom-end" sx={{ zIndex: 1300 }}>
                  <MenuItem onClick={() => navigate('/profile')}>
                    👤 {t('navigation.profile')}
                  </MenuItem>
                  {user?.profile?.role?.toLowerCase() === 'admin' && (
                    <MenuItem onClick={() => navigate('/admin')}>
                      ⚙️ {t('navigation.adminDashboard')}
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout} sx={{ color: 'danger.500' }}>
                    🚪 {t('navigation.logout')}
                  </MenuItem>
                </Menu>
              </Dropdown>
            </Box>
          ) : (
            /* Login/Register Buttons */
            <>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'neutral.300',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.400', bgcolor: 'neutral.50' }
                }}
              >
                {t('navigation.login')}
              </Button>
              <Button
                variant="solid"
                size="sm"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: 'primary.600',
                  '&:hover': { bgcolor: 'primary.700' }
                }}
              >
                {t('navigation.register')}
              </Button>
            </>
          )}
        </Box>
      </Sheet>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          py: 3,
          px: 2,
          maxWidth: '1200px',
          mx: 'auto',
          width: '100%',
        }}
      >
        {children}
      </Box>

      {/* Footer */}
      <Sheet
        component="footer"
        sx={{
          p: 3,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'neutral.200',
          bgcolor: 'background.surface',
          mt: 'auto',
        }}
      >
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
          {t('footer.copyright')}
        </Typography>
      </Sheet>
    </Box>
  );
}
