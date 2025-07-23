import { useState, useMemo, useEffect } from 'react'
import {
  IconAdjustmentsHorizontal,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { appsMap } from './data/apps'
import { useAuth } from '@/stores/authStore'
import { useUnreadCountService } from '@/services/websocket-service'

const appText = new Map<string, string>([
  ['all', 'All Apps'],
  ['connected', 'Connected'],
  ['notConnected', 'Not Connected'],
])

export default function Apps() {
  const [sort, setSort] = useState('descending')
  // const [appType, setAppType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { user: authUser } = useAuth()
  const { getUnreadCount, registerUserIds, getConnectionStatus } = useUnreadCountService()

  // 获取当前用户的apps
  const userEmail = authUser?.email
  const userApps = useMemo(() => {
    if (!userEmail) return []
    return appsMap.get(userEmail) || []
  }, [userEmail])

  // 注册用户ID到WebSocket服务
  useEffect(() => {
    if (userApps.length > 0) {
      const userIds = userApps.map(app => app.userId)
      const uniqueUserIds = [...new Set(userIds)] // 去重
      registerUserIds(uniqueUserIds)
      console.log('已注册用户ID列表:', uniqueUserIds)
    }
  }, [userApps, registerUserIds])

  // 获取实时未读消息数的应用列表
  const appsWithRealTimeUnread = useMemo(() => {
    return userApps.map(app => ({
      ...app,
      unreadCount: getUnreadCount(app.userId), // 使用WebSocket数据，-1表示未获取
    }))
  }, [userApps, getUnreadCount])

  const filteredApps = appsWithRealTimeUnread
    .slice()
    .sort((a, b) =>
      sort === 'ascending'
        ? a.unreadCount - b.unreadCount
        : b.unreadCount - a.unreadCount
    )
    // .filter((app) =>
    //   appType === 'connected'
    //     ? app.connected
    //     : appType === 'notConnected'
    //       ? !app.connected
    //       : true
    // )
    .filter((app) => app.username.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        {/* <Search /> */}
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Main fixed>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            多账号管理
          </h1>
          <p className='text-muted-foreground'>
            所有代运营账号的列表，可以在这里进行管理
          </p>
          {/* WebSocket状态指示器 */}
          <div className='mt-2 flex items-center gap-2 text-xs'>
            <div 
              className={`h-2 w-2 rounded-full ${
                getConnectionStatus() ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className='text-muted-foreground'>
              WebSocket: {getConnectionStatus() ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Filter apps...'
              className='h-9 w-40 lg:w-[250px]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* <Select value={appType} onValueChange={setAppType}>
              <SelectTrigger className='w-36'>
                <SelectValue>{appText.get(appType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Apps</SelectItem>
                <SelectItem value='connected'>Connected</SelectItem>
                <SelectItem value='notConnected'>Not Connected</SelectItem>
              </SelectContent>
            </Select> */}
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className='w-16'>
              <SelectValue>
                <IconAdjustmentsHorizontal size={18} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align='end'>
              <SelectItem value='ascending'>
                <div className='flex items-center gap-4'>
                  <IconSortAscendingLetters size={16} />
                  <span>Ascending</span>
                </div>
              </SelectItem>
              <SelectItem value='descending'>
                <div className='flex items-center gap-4'>
                  <IconSortDescendingLetters size={16} />
                  <span>Descending</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator className='shadow-sm' />
        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
          {filteredApps.map((app) => (
            <li
              key={app.email}
              className='rounded-lg border p-4 hover:shadow-md'
            >
              <div className='mb-8 flex items-center justify-between'>
                <div
                  className={`bg-muted flex size-10 items-center justify-center rounded-lg p-2 font-bold ${
                    app.unreadCount === -1 ? '' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {app.unreadCount === -1 ? '---' : app.unreadCount}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                >
                  {app.category}
                </Button>
              </div>
              <div>
                <h2 className='mb-1 font-semibold'>{app.username} | {app.email}</h2>
                <p className='line-clamp-2 text-gray-500'>{app.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Main>
    </>
  )
}
