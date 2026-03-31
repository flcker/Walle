import fs from 'fs';
import path from 'path';
import { siteConfig } from './config';

/**
 * Server Component：读取当前主题的 CSS 并注入为内联 <style>。
 *
 * 加载顺序（内容拼接后一次性注入）：
 *   1. src/themes/<theme>/schemes/*.css（所有配色方案，若目录存在）
 *   2. src/themes/<theme>/theme.css（结构样式，可选）
 *
 * 所有 scheme CSS 一次性全部注入，由 data-color-scheme 属性选择器决定哪套生效。
 */
export function ThemeGlobalStyles() {
  const { theme } = siteConfig;
  let css = '';

  // 1. 注入所有可用 scheme CSS（若 schemes/ 目录存在）
  const schemesDir = path.join(process.cwd(), 'src/themes', theme, 'schemes');
  if (fs.existsSync(schemesDir)) {
    const files = fs.readdirSync(schemesDir).filter(f => f.endsWith('.css')).sort();
    for (const file of files) {
      try {
        css += fs.readFileSync(path.join(schemesDir, file), 'utf-8');
      } catch {
        // skip
      }
    }
  }

  // 2. 加载主题结构文件
  try {
    const themePath = path.join(process.cwd(), 'src/themes', theme, 'theme.css');
    css += fs.readFileSync(themePath, 'utf-8');
  } catch {
    // theme.css 不存在，跳过
  }

  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
