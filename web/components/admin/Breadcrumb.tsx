import Link from 'next/link';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';

export function Breadcrumb() {
  const items = [
    {
      href: '/workshop-assistant',
      title: (
        <span>
          <HomeOutlined />
          <span style={{ marginLeft: 8 }}>Workshop Assistant</span>
        </span>
      ),
    },
    {
      title: (
        <span>
          <SettingOutlined />
          <span style={{ marginLeft: 8 }}>Admin</span>
        </span>
      ),
    },
  ];

  return (
    <AntBreadcrumb
      style={{ marginBottom: 24 }}
      items={items}
      itemRender={(route, params, routes, paths) => {
        const last = routes.indexOf(route) === routes.length - 1;
        return last || !route.href ? (
          <span>{route.title}</span>
        ) : (
          <Link href={route.href}>{route.title}</Link>
        );
      }}
    />
  );
} 