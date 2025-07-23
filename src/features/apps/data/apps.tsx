import {
  IconBrandDiscord,
  IconBrandDocker,
  IconBrandFigma,
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandGmail,
  IconBrandMedium,
  IconBrandNotion,
  IconBrandSkype,
  IconBrandSlack,
  IconBrandStripe,
  IconBrandTelegram,
  IconBrandTrello,
  IconBrandWhatsapp,
  IconBrandZoom,
} from '@tabler/icons-react'
import type { JSX } from 'react'

// 示例用户数据
const userAppsMap = new Map<string, Array<{
  username: string
  email: string
  userId: string
  category: string
  unreadCount: number
  desc: string
}>>()

// 刘阳
userAppsMap.set('liuyang@ok.com', [
  {
    username: '刘阳',
    email: 'liuyang@ok.com',
    userId: 'user001',
    category: '招聘',
    unreadCount: 2,
    desc: '说明',
  },
  {
    username: '刘阳',
    email: 'liuyang@ok.com',
    userId: 'user001',
    category: '招聘',
    unreadCount: 0,
    desc: '说明',
  },
  {
    username: '刘阳',
    email: 'liuyang@ok.com',
    userId: 'user001',
    category: '招聘',
    unreadCount: 5,
    desc: '说明',
  },
  {
    username: '刘阳',
    email: 'liuyang@ok.com',
    userId: 'user001',
    category: '招聘',
    unreadCount: 0,
    desc: '说明',
  },
])

// 何鑫
userAppsMap.set('hexin@ok.com', [
  {
    username: '何鑫',
    email: 'hexin@ok.com',
    userId: 'user002',
    category: '二手',
    unreadCount: 1,
    desc: '说明',
  },
  {
    username: '何鑫',
    email: 'hexin@ok.com',
    userId: 'user002',
    category: '二手',
    unreadCount: 0,
    desc: '说明',
  },
  {
    username: '何鑫',
    email: 'hexin@ok.com',
    userId: 'user002',
    category: '二手',
    unreadCount: 0,
    desc: '说明',
  },
  {
    username: '何鑫',
    email: 'hexin@ok.com',
    userId: 'user002',
    category: '二手',
    unreadCount: 3,
    desc: '说明',
  },
])

export const appsMap = userAppsMap;
