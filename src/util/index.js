class myClass {
  constructor(name) {
    this.name = name
  }

  //   存值函数和取值函数，定义（作用于）在函数的属性上
  get names() {
    return this.name;
  }
  set names(ace = '进行数据补充') {
    return
  }
}
export default myClass
