/**
 * utils/notifications.ts
 * Hệ thống thông báo ngày giỗ / sinh nhật cho gia phả
 * 
 * Hoạt động theo 2 lớp:
 *  1. In-app banner — hiển thị khi mở app nếu có sự kiện trong 3 ngày tới
 *  2. Web Push Notification — thông báo nền (khi app đang đóng), cần Service Worker
 */

import { Member } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────
export interface UpcomingEvent {
  member:   Member;
  type:     'death' | 'birthday';
  daysLeft: number;        // 0 = hôm nay, 1 = ngày mai, ...
  dateLabel: string;       // "Hôm nay", "Ngày mai", "3 ngày nữa"
  eventLabel: string;      // "Giỗ lần thứ 12", "Sinh nhật 85 tuổi"
  lunar?: string;          // Ngày âm lịch nếu có
}

// ── Tính sự kiện sắp tới (N ngày tới) ────────────────────────────────────
export function getUpcomingEvents(members: Member[], withinDays = 7): UpcomingEvent[] {
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  const results: UpcomingEvent[] = [];

  members.forEach(m => {
    // Ngày giỗ (dương lịch nếu có deathDate)
    if (m.deathDate) {
      const death = new Date(m.deathDate);
      const thisYear = new Date(today.getFullYear(), death.getMonth(), death.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const diff = Math.round((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff <= withinDays) {
        const yearsAgo = thisYear.getFullYear() - death.getFullYear();
        results.push({
          member: m,
          type: 'death',
          daysLeft: diff,
          dateLabel: formatDaysLeft(diff),
          eventLabel: `Giỗ lần thứ ${yearsAgo}`,
          lunar: m.deathDateLunar,
        });
      }
    }

    // Sinh nhật (chỉ người còn sống)
    if (m.birthDate && !m.deathDate) {
      const birth = new Date(m.birthDate);
      const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const diff = Math.round((thisYear.getTime() - today.getTime()) / 86400000);
      if (diff <= withinDays) {
        const age = thisYear.getFullYear() - birth.getFullYear();
        results.push({
          member: m,
          type: 'birthday',
          daysLeft: diff,
          dateLabel: formatDaysLeft(diff),
          eventLabel: `Sinh nhật ${age} tuổi`,
          lunar: m.birthDateLunar,
        });
      }
    }
  });

  // Sắp xếp: hôm nay trước, ngày giỗ trước sinh nhật nếu cùng ngày
  return results.sort((a, b) => {
    if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
    if (a.type !== b.type) return a.type === 'death' ? -1 : 1;
    return a.member.name.localeCompare(b.member.name);
  });
}

function formatDaysLeft(days: number): string {
  if (days === 0) return '🔴 Hôm nay';
  if (days === 1) return '🟠 Ngày mai';
  if (days <= 3)  return `🟡 ${days} ngày nữa`;
  return `⚪ ${days} ngày nữa`;
}

// ── Web Push Notification API ─────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Gửi thông báo ngay lập tức (dùng để test hoặc khi app đang mở)
export function sendImmediateNotification(event: UpcomingEvent): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const icon  = event.type === 'death' ? '🕯️' : '🎂';
  const title = `${icon} ${event.eventLabel} — ${event.member.name}`;
  const body  = [
    event.dateLabel,
    event.lunar ? `Âm lịch: ${event.lunar}` : '',
    `Đời thứ ${event.member.generation}`,
  ].filter(Boolean).join(' · ');

  new Notification(title, {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: `gia-pha-${event.type}-${event.member.id}`,
    requireInteraction: event.daysLeft === 0, // Giữ thông báo hôm nay cho đến khi bấm
  });
}

// Kiểm tra và gửi thông báo cho tất cả sự kiện hôm nay
export function checkAndNotifyToday(members: Member[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const STORAGE_KEY = 'gia_pha_notified_today';
  const todayStr    = new Date().toISOString().slice(0, 10);

  // Tránh thông báo nhiều lần trong ngày
  const alreadyNotified = localStorage.getItem(STORAGE_KEY);
  if (alreadyNotified === todayStr) return;

  const todayEvents = getUpcomingEvents(members, 0); // chỉ hôm nay
  if (todayEvents.length === 0) return;

  // Gửi từng thông báo với delay 1.5s để không spam
  todayEvents.forEach((evt, i) => {
    setTimeout(() => sendImmediateNotification(evt), i * 1500);
  });

  localStorage.setItem(STORAGE_KEY, todayStr);
}

// Lên lịch thông báo cho ngày mai (dùng setTimeout — đủ cho PWA đang chạy)
export function scheduleUpcomingNotifications(members: Member[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const events = getUpcomingEvents(members, 3).filter(e => e.daysLeft > 0);
  events.forEach(evt => {
    const ms = evt.daysLeft * 24 * 60 * 60 * 1000;
    // Chỉ lên lịch cho sự kiện trong 24h để tránh leak
    if (ms <= 24 * 60 * 60 * 1000 + 60000) {
      setTimeout(() => sendImmediateNotification(evt), ms);
    }
  });
}
