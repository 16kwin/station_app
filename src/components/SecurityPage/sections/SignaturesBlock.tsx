// SignaturesBlock.tsx — блок подписей в конце печатного отчёта (9.1, п. 2): представитель поставщика,
// ответственный за ИБ заказчика, дата. Рядом — отпечаток профиля: подпись относится к этому профилю.
import React from 'react';
import { Mono } from './ui';

const SIGNERS = ['Представитель поставщика', 'Ответственный за ИБ заказчика'];

const SignaturesBlock: React.FC<{ fingerprint: string }> = ({ fingerprint }) => (
  <section className="sp-signatures">
    <h2 className="sp-h2">Подписи</h2>
    <p className="sp-lead">
      Профиль с отпечатком <Mono wrap>{fingerprint}</Mono> проверен. Отпечаток совпадает с выводом команды print-features
      на сервере.
    </p>
    <table className="sp-sign-table">
      <tbody>
        {SIGNERS.map(who => (
          <tr key={who}>
            <td className="sp-sign-who">{who}</td>
            <td>
              <div className="sp-sign-line" />
              <div className="sp-sign-hint">должность, ФИО</div>
            </td>
            <td>
              <div className="sp-sign-line" />
              <div className="sp-sign-hint">подпись</div>
            </td>
            <td>
              <div className="sp-sign-line" />
              <div className="sp-sign-hint">дата</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default SignaturesBlock;
