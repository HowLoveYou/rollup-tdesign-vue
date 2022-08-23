<template>
  <t-select
    ref="asyncSelect"
    :value="currentVal"
    :placeholder="selectProps.placeholder || '请输入搜索'"
    :multiple="multiple"
    class="async-select"
    :filter="() => true"
    :popupProps="{
      overlayClassName: [
        'async-select-popup',
        { isExpend: isExpend },
        blockName,
      ],
      onScroll: handlescroll,
    }"
    :filterable="!multiple"
    @search="search"
    @change="change"
    @popup-visible-change="popupVisibleChange"
    v-bind="selectProps"
    v-on="listeners"
  >
    <!--多选搜索-->
    <div slot="panelTopContent" v-if="multiple" style="height: 40px">
      <div class="async-input">
        <t-input
          v-model="input"
          :clearable="true"
          @change="mulSearch"
          @blur="blur"
          v-bind="mulInputProps"
        />
      </div>
    </div>
    <!-- 展示内容 -->
    <t-option
      v-for="item in options"
      :value="item.value"
      :label="item.label"
      :key="item.value"
      :disabled="item.disabled"
    >
      <slot :option="item">
        <template v-if="renderType === 'normal'">
          {{ item.label }}
        </template>
        <template v-if="renderType === 'person'">
          <hr-person :msg="item" />
        </template>
      </slot>
    </t-option>
    <!--缓存options-->
    <t-option
      v-for="item in extraOptions"
      :value="item.value"
      :label="item.label"
      :key="item.value"
      class="cache-option"
    ></t-option>
    <div slot="panelBottomContent" class="select-panel-footer">
      <div class="load-more" v-show="loading">
        <t-loading :loading="loading" text="数据加载中..." size="small" />
      </div>
      <div class="no-load-more" v-show="!loadMore && page !== 1">
        没有更多数据了~
      </div>
      <!-- 有缓存但是无搜索数据 -->
      <div
        class="t-select__loading-tips"
        v-if="!this.options.length && this.extraOptions.length"
      >
        {{ emptyTips }}
      </div>
    </div>
    <div
      slot="empty"
      class="select-empty"
      v-show="!this.options.length && !this.extraOptions.length"
    >
      {{ emptyTips }}
    </div>
    <!--插槽-->
    <template v-for="slot in Object.keys(scopedSlots)" #[slot]="{ col, row }">
      <slot :name="slot" v-bind="{ col, row }"></slot>
    </template>
  </t-select>
</template>

<script>
  import debounce from 'lodash/debounce';
  import HrPerson from './person.vue';

  export default {
    name: 'hr-select-async',
    data() {
      return {
        blockName: '', //绑定的类名
        currentVal: this.multiple ? [] : '', //当前存储的值
        options: [],
        input: '',
        page: 1,
        loading: false, //loadMore loading
        loadMore: true, //是否加载更多
        cacheOptions: [], //缓存的options
        extraOptions: [], //回显的不存在的options
        apiNum: 0, //请求次数
        preParams: {}, //上一次的请求参数
        echo: false, //是否回显
      };
    },
    components: {
      // eslint-disable-next-line vue/no-unused-components
      HrPerson,
    },
    model: {
      prop: 'value',
      event: 'change',
    },
    props: {
      //回显值
      value: {
        type: [String, Array],
      },
      //查询方法
      onSearch: {
        type: Function,
        default: () => {
          return new Promise(() => {});
        },
      },
      //是否分页
      paging: {
        type: Boolean,
        default: true,
      },
      //是否多选
      multiple: {
        type: Boolean,
        default: false,
      },
      //多选input属性
      mulInputProps: {
        type: Object,
        required: false,
        default: () => {
          return {
            placeholder: '姓名和工号搜索',
          };
        },
      },
      //查询无数据展示
      emptyTips: {
        type: String,
        default: '暂无数据',
      },
      //下拉框宽度是否随内容长度变化
      isExpend: {
        type: Boolean,
        default: false,
      },
      //自定义渲染
      renderType: {
        type: String,
        default: 'normal', //normal(正常展示)、person(人员)
      },
      //是否首次加载数据
      isFirst: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      selectProps() {
        /* eslint-disable no-unused-vars */
        const { onSearch, mulInputProps, ...rest } = this.$attrs;
        return rest;
      },
      listeners() {
        const { change, ...rest } = this.$listeners;
        return rest;
      },
      scopedSlots() {
        const { default: defaultFun, ...rest } = this.$scopedSlots;
        return rest;
      },
    },
    watch: {
      value: {
        handler(val) {
          //判断是否需要回显
          const totalValues = [...this.options, ...this.extraOptions].map(
            (item) => item.value
          );
          if (this.multiple) {
            this.echo =
              val.length && !val.every((item) => totalValues.includes(item));
          } else {
            this.echo = val && !totalValues.includes(val);
          }
          if (this.echo) {
            this.mulSearch(); //回显
          } else {
            this.currentVal = val; //不需要回显直接赋值
          }
        },
        deep: true,
        immediate: true,
      },
    },
    created() {
      if (!this.value && !this.value?.length && this.isFirst) {
        this.getData();
      }
    },
    mounted() {
      this.createUnique();
    },
    methods: {
      //初始化
      init() {
        this.page = 1;
        this.preParams = {};
        this.cache();
      },
      //创造唯一class
      createUnique() {
        const random = (((1 + Math.random()) * 0x10000) | 0)
          .toString(16)
          .substring(1);
        this.blockName = 'async-select-' + random;
      },
      //单选搜索
      search(val) {
        this.input = val;
        this.mulSearch();
      },
      //多选搜索
      mulSearch() {
        this.init();
        this.loadMore = true;
        debounce(this.getData, 600)();
      },
      //处理请求参数
      getParams() {
        let params;
        if (this.echo) {
          //回显
          params = {
            age: 1,
            value: this.multiple ? this.value.join(',') : this.value,
          };
        } else {
          params =
            this.page === 1
              ? { page: 1, value: this.input }
              : { ...this.preParams, page: this.page }; //如果不是第一页，记录第一页请求参数，loadmore改变page即可
        }
        return params;
      },
      //异步获取数据
      getData() {
        const params = this.getParams();
        const num = ++this.apiNum;
        this.onSearch(params)
          .then((res) => {
            if (num !== this.apiNum) return; //保证只处理最后一条
            if (Array.isArray(res)) {
              this.options =
                this.page === 1 ? [...res] : [...this.options, ...res]; //返回数据
              this.preParams = { ...params }; //记录上一次请求的参数
              this.cache();
              if (this.echo) {
                this.currentVal = this.value;
              }
              if (!res.length) {
                this.loadMore = false;
              }
            }
          })
          .catch(() => {
            this.init();
          })
          .finally(() => {
            this.echo = false; //回显结束
            this.loading = false;
          });
      },

      //滚动加载
      handlescroll({ e }) {
        if (!this.paging) return;
        const { scrollTop, scrollHeight, clientHeight } = e.target || {};
        if (scrollHeight - scrollTop - clientHeight < 50) {
          debounce(() => {
            if (!this.loadMore || this.loading) return;
            this.page++;
            if (this.options.length) {
              this.loading = true;
            }
            this.getData();
          }, 300)();
        }
      },
      //多选input失焦事件
      blur(val, { e }) {
        e.stopPropagation();
        this.input = '';
      },
      //存储已缓存的options
      cache() {
        const { currentVal } = this;
        const totalOptions = [...this.options];
        this.cacheOptions.forEach((item) => {
          const index = totalOptions.findIndex((t) => t.value === item.value);
          if (index === -1) {
            totalOptions.push(item);
          }
        });
        //缓存已选中的option做回显使用
        this.cacheOptions = totalOptions.filter((item) => {
          return this.multiple
            ? currentVal.includes(item.value)
            : currentVal === item.value;
        });
        //options和cacheOptions去重
        const optionsAllVal = this.options.map((item) => item.value);
        this.extraOptions = this.cacheOptions.filter(
          (item) => !optionsAllVal.includes(item.value)
        );
      },
      change(val) {
        this.currentVal = val;
        this.cache();
        this.$emit(
          'change',
          val,
          this.multiple ? this.cacheOptions : this.cacheOptions[0]
        );
      },
      //设置弹窗最小宽度
      popupVisibleChange(visible) {
        if (visible) {
          const wd = this.$refs.asyncSelect.$el.offsetWidth;
          setTimeout(() => {
            const pop = document.getElementsByClassName(this.blockName);
            if (pop.length) {
              pop[0].style.minWidth = wd + 'px';
            }
          }, 0);
        }
      },
      //清除
      clear() {
        this.options = [];
        this.cacheOptions = [];
        this.extraOptions = [];
        this.preParams = {};
        this.apiNum = 0;
        this.page = 1;
      },
    },
  };
</script>
<style lang="less">
  .async-select-popup {
    position: relative;
    &.isExpend {
      width: auto !important;
      .t-select-option > span {
        display: inline;
      }
    }
    .t-select-option {
      display: flex;
      align-items: center;
      height: auto;
      min-height: 28px;
      &:hover {
        background: #ecf2fe;
      }
      > span {
        display: inline-block;
        width: 100%;
      }
    }
    .cache-option {
      padding: 0;
      margin: 0;
      height: 0;
      min-height: 0;
    }
  }
</style>
<style lang="less" scoped>
  .async-select {
    width: 100%;
    position: relative;
    /deep/ .t-popup {
      min-width: 100%;
    }
  }

  .no-load-more {
    padding: 10px 0;
    text-align: center;
    color: #999;
    font-size: 12px;
  }
  .async-input {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 8px;
    width: 100%;
    padding: 6px 16px 10px;
    background-color: #fff;
  }
  .load-more {
    text-align: center;
    widows: 100%;
    padding: 20px 0;
  }
  .select-empty {
    text-align: center;
    color: var(--td-text-color-disabled);
    line-height: 32px;
    // padding: 60px 0;
  }
</style>
