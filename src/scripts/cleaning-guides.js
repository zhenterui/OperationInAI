window.opsCleaningGuides = {
  placeholderConfigExample: [
    { name: "start_time", source: "mapping", from: "context.start_time" },
    { name: "env", source: "custom", value: "prod" },
    { name: "product", source: "dictionary", from: "产品列表.产品名", mode: "array" }
  ],
  ruleActionGuides: {
    trim: { placeholder: "无需参数", help: "去除输入值首尾空格。字段映射中选择此规则后，源字段作为输入，目标字段作为输出。" },
    lower: { placeholder: "无需参数", help: "把输入值转换为小写，适合统一英文编码、环境名、状态值。" },
    upper: { placeholder: "无需参数", help: "把输入值转换为大写，适合统一等级、区域、状态编码。" },
    enum: { placeholder: "caseInsensitive=true; roma=ROMAConnect; apm=APM", help: "按 key=value 做枚举归一；可用 caseInsensitive=true 忽略大小写。也可以引用字典集辅助表达业务含义。", dictionary: true },
    default: { placeholder: "未分配", help: "当输入为空时使用该参数作为默认值；输入非空时保留原值。" },
    dedupe: { placeholder: ",", help: "对多个输入值去重后按参数作为分隔符合并；参数为空时默认用英文逗号。" },
    merge: { placeholder: ",", help: "把多个输入值直接按分隔符合并，不做去重。" },
    split_dedupe_join: { placeholder: "separator=,; joinSeparator=,; dedupe=true; sort=false; limit=0", help: "先按 separator 拆分，再可去重、排序、限制数量，最后按 joinSeparator 合并。" },
    strip_html: { placeholder: "remove_script=true; remove_style=true; decode_entities=true; collapse_whitespace=true", help: "移除 HTML 标签、脚本样式并解码实体，适合接口返回富文本说明。" },
    replace_all: { placeholder: "pattern=\\d; replacement=#; flags=g", help: "用正则全局替换文本。pattern 是正则表达式，replacement 是替换值，flags 默认 g。" },
    extract: { placeholder: "^([^|]+)\\|([^|]+)\\|", help: "用正则从输入值中提取内容；优先返回第一个捕获组，没有捕获组时返回完整命中。" },
    combine: { placeholder: "{{product}}-{{version}}", help: "用模板组合当前记录字段，字段名写在双大括号里，例如 {{product}}。" },
    filter: { placeholder: "level in [P0,P1] && env == prod", help: "条件表达式用于记录过滤。支持 ==、!=、contains、in [...]、exists、&&、||。" },
    date: { placeholder: "无需参数", help: "把可识别的时间输入转换为 ISO 时间；无法识别时保留原值。" },
    number: { placeholder: "seconds_to_minutes", help: "数值转换。当前支持 seconds_to_minutes，也可留空只做数字化校验。" },
    enrich: { placeholder: "暂作为语义配置", help: "关联补齐动作当前作为配置语义保留；实际补齐建议在业务流中用数据源节点和字段映射完成。" }
  }
};
