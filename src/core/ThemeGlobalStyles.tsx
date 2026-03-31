import fs from 'fs';
import path from 'path';
import { siteConfig } from './config';

/**
 * Server Component：读取当前主题的 CSS 并注入为内联 <style>。
 *
 * 加载顺序（内容拼接后一次性注入）：
 *   1. src/themes/<theme>/schemes/<colorScheme>.css（配色变量，可选）
 *   2. src/themes/<theme>/theme.css（结构样式，可选）
 *
 * 任一文件不存在时静默忽略，使用 globals.css 的基础变量兜底。
 */
export function ThemeGlobalStyles() {
  const { theme } = siteConfig;
  const scheme = 'themeOptions' in siteConfig
    ? (siteConfig as typeof siteConfig & { themeOptions?: { colorScheme?: string } }).themeOptions?.colorScheme
    : undefined;

  let css = '';

  // 1. 尝试加载配色方案文件
  if (scheme) {
    try {
      const schemePath = path.join(process.cwd(), 'src/themes', theme, 'schemes', `${scheme}.css`);
      css += fs.readFileSync(schemePath, 'utf-8');
    } catch {
      // 配色文件不存在，跳过
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
