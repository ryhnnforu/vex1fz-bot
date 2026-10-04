/**
 * Logger warna-warni buat terminal Termux
 */
import chalk from 'chalk'

const jam = () =>
  new Date().toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

const tag = (t, c) => c(`[${jam()}]`) + ' ' + c.bold(`[${t}]`)

export const log = {
  info: (...a) => console.log(tag('INFO', chalk.cyan), ...a),
  ok: (...a) => console.log(tag('OK', chalk.green), ...a),
  cmd: (...a) => console.log(tag('CMD', chalk.magenta), ...a),
  warn: (...a) => console.log(tag('WARN', chalk.yellow), ...a),
  error: (...a) => console.log(tag('ERROR', chalk.red), ...a),
  ai: (...a) => console.log(tag('AI', chalk.blue), ...a),
  raw: (...a) => console.log(...a)
}

/** banner ASCII saat bot dinyalakan */
export function banner () {
  console.log(
    chalk.hex('#a855f7').bold(`
 ████████╗██╗  ██╗███████╗██████╗ ██╗   ██╗██╗  ██╗ █████╗ ███╗   ███╗
 ╚══██╔══╝██║  ██║██╔════╝██╔══██╗╚██╗ ██╔╝██║  ██║██╔══██╗████╗ ████║
    ██║   ███████║█████╗  ██████╔╝ ╚████╔╝ ███████║███████║██╔████╔██║
    ██║   ██╔══██║██╔══╝  ██╔══██╗  ╚██╔╝  ██╔══██║██╔══██║██║╚██╔╝██║
    ██║   ██║  ██║███████╗██║  ██║   ██║   ██║  ██║██║  ██║██║ ╚═╝ ██║
    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
`)
  )
  console.log(chalk.gray('  » WhatsApp Bot Multi Device — Interactive • Button List • AI Rich'))
  console.log(chalk.gray('  » Support Termux (Android)\n'))
}

export default log
